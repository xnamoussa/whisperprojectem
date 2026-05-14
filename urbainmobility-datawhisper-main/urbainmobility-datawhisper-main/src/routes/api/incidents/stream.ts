import { createFileRoute } from "@tanstack/react-router";
import { DEMO_INCIDENTS } from "@/lib/demo-network";
import { cypher, neo4jConfigured } from "@/lib/neo4j-http.server";

type Incident = {
  id: string;
  line: string;
  station?: string;
  severity: "high" | "medium" | "low";
  type: string;
  message: string;
  since: string;
  impact: string;
  status?: string;
};

async function fetchIncidents(): Promise<{ incidents: Incident[]; source: "neo4j" | "demo" }> {
  if (neo4jConfigured()) {
    try {
      const rows = await cypher<Incident>(
        `MATCH (i:Incident)
         WHERE coalesce(i.status,'ACTIF') = 'ACTIF'
         RETURN i.id AS id, i.line AS line, i.station AS station,
                i.severity AS severity, i.type AS type, i.message AS message,
                coalesce(i.since,'') AS since, coalesce(i.impact,'') AS impact,
                coalesce(i.status,'ACTIF') AS status
         ORDER BY CASE i.severity WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END
         LIMIT 100`,
      );
      if (rows.length) return { incidents: rows, source: "neo4j" };
    } catch (e) {
      console.error("SSE incidents Neo4j fallback:", (e as Error).message);
    }
  }
  return { incidents: DEMO_INCIDENTS as Incident[], source: "demo" };
}

const TICK_MS = 5000;
const HEARTBEAT_MS = 25000;
const MAX_CONNECTION_MS = 5 * 60 * 1000; // 5 min, le client se reconnecte automatiquement

export const Route = createFileRoute("/api/incidents/stream")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const encoder = new TextEncoder();
        let closed = false;
        let lastHash = "";

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const send = (event: string, data: unknown) => {
              if (closed) return;
              const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
              try {
                controller.enqueue(encoder.encode(payload));
              } catch {
                closed = true;
              }
            };

            const tick = async () => {
              const { incidents, source } = await fetchIncidents();
              const hash = JSON.stringify(incidents.map((i) => [i.id, i.severity, i.status ?? "ACTIF"]));
              if (hash !== lastHash) {
                lastHash = hash;
                send("incidents", { incidents, source, ts: Date.now() });
              }
            };

            send("hello", { ts: Date.now() });
            await tick();

            const tickTimer = setInterval(() => {
              tick().catch(() => {});
            }, TICK_MS);
            const beatTimer = setInterval(() => {
              if (closed) return;
              try {
                controller.enqueue(encoder.encode(`: keep-alive ${Date.now()}\n\n`));
              } catch {
                closed = true;
              }
            }, HEARTBEAT_MS);
            const lifeTimer = setTimeout(() => {
              cleanup();
              try {
                controller.close();
              } catch {}
            }, MAX_CONNECTION_MS);

            const cleanup = () => {
              closed = true;
              clearInterval(tickTimer);
              clearInterval(beatTimer);
              clearTimeout(lifeTimer);
            };

            request.signal.addEventListener("abort", () => {
              cleanup();
              try {
                controller.close();
              } catch {}
            });
          },
          cancel() {
            closed = true;
          },
        });

        return new Response(stream, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
