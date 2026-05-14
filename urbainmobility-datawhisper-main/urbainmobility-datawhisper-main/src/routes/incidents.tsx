import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LineBadge } from "./itineraire";
import { AlertTriangle, Activity, CheckCircle2, BellRing, BellOff, Radio, RadioTower } from "lucide-react";

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

export const Route = createFileRoute("/incidents")({
  component: IncidentsPage,
  head: () => ({
    meta: [
      { title: "Incidents temps réel — GraphMobility" },
      { name: "description", content: "Centre d'incidents transports : détection d'anomalies sur graphe Neo4j." },
    ],
  }),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-10 text-center">
        <p className="text-destructive">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-4 underline">Réessayer</button>
      </div>
    );
  },
});

function IncidentsPage() {
  const [alertsOn, setAlertsOn] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [lastUpdateTs, setLastUpdateTs] = useState<number | null>(null);
  const [connState, setConnState] = useState<"connecting" | "live" | "offline">("connecting");
  const [source, setSource] = useState<"neo4j" | "demo" | null>(null);
  const prevRef = useRef<Map<string, { severity: string; status: string }> | null>(null);
  const alertsOnRef = useRef(alertsOn);
  alertsOnRef.current = alertsOn;

  // Connexion SSE temps réel — reconnexion automatique côté EventSource
  useEffect(() => {
    if (typeof window === "undefined") return;
    const es = new EventSource("/api/incidents/stream");
    es.addEventListener("hello", () => setConnState("live"));
    es.onopen = () => setConnState("live");
    es.onerror = () => setConnState("offline");
    es.addEventListener("incidents", (ev) => {
      try {
        const payload = JSON.parse((ev as MessageEvent).data) as {
          incidents: Incident[];
          source: "neo4j" | "demo";
          ts: number;
        };
        setIncidents(payload.incidents);
        setLastUpdateTs(payload.ts);
        setSource(payload.source);
        setConnState("live");
      } catch {
        /* ignore */
      }
    });
    return () => es.close();
  }, []);

  // Diff -> notifications
  useEffect(() => {
    const current = new Map<string, { severity: string; status: string }>(
      incidents.map((i) => [i.id, { severity: i.severity, status: i.status ?? "ACTIF" }]),
    );
    const prev = prevRef.current;
    if (prev && alertsOnRef.current) {
      for (const [id, cur] of current) {
        const before = prev.get(id);
        const inc = incidents.find((x) => x.id === id);
        if (!before) {
          if (cur.severity === "high") {
            toast.error(`Incident critique · ${inc?.line ?? ""}`, {
              description: inc?.message ?? "Nouvel incident détecté",
              duration: 8000,
            });
          } else if (cur.severity === "medium") {
            toast.warning(`Incident modéré · ${inc?.line ?? ""}`, { description: inc?.message ?? "" });
          }
        } else if (before.status === "ACTIF" && cur.status === "RESOLU") {
          toast.success(`Incident résolu · ${inc?.line ?? ""}`, { description: inc?.message ?? "" });
        } else if (before.severity !== cur.severity && cur.severity === "high") {
          toast.error(`Aggravation · ${inc?.line ?? ""}`, { description: `Sévérité passée à critique` });
        }
      }
      for (const [id, before] of prev) {
        if (!current.has(id) && before.status === "ACTIF") {
          toast.success(`Incident clôturé`, { description: `#${id}` });
        }
      }
    }
    prevRef.current = current;
  }, [incidents]);

  const counts = {
    high: incidents.filter((i) => i.severity === "high").length,
    medium: incidents.filter((i) => i.severity === "medium").length,
    low: incidents.filter((i) => i.severity === "low").length,
  };
  const lastUpdate = lastUpdateTs ? new Date(lastUpdateTs).toLocaleTimeString("fr-FR") : "—";
  const liveDotColor =
    connState === "live" ? "bg-success" : connState === "connecting" ? "bg-warning" : "bg-destructive";
  const liveLabel =
    connState === "live" ? "SSE live" : connState === "connecting" ? "Connexion…" : "Hors ligne";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Centre d'incidents</h1>
            <p className="mt-3 text-muted-foreground">
              Flux temps réel via Server-Sent Events — notifications instantanées dès qu'un incident apparaît, change de gravité ou est résolu.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setAlertsOn((v) => {
                  const nv = !v;
                  toast(nv ? "Alertes temps réel activées" : "Alertes désactivées");
                  return nv;
                });
              }}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                alertsOn
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary/60"
              }`}
              title={alertsOn ? "Désactiver les notifications" : "Activer les notifications"}
            >
              {alertsOn ? <BellRing className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
              {alertsOn ? "Alertes ON" : "Alertes OFF"}
            </button>
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs">
              <span className="relative flex h-2 w-2">
                {connState === "live" && (
                  <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${liveDotColor} opacity-75`} />
                )}
                <span className={`relative inline-flex h-2 w-2 rounded-full ${liveDotColor}`} />
              </span>
              {connState === "offline" ? (
                <RadioTower className="h-3 w-3 opacity-60" />
              ) : (
                <Radio className="h-3 w-3 opacity-60" />
              )}
              {liveLabel}
              {source && <span className="text-muted-foreground">· {source}</span>}
              <span className="text-muted-foreground">· {lastUpdate}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <SeverityCard label="Critiques" count={counts.high} icon={AlertTriangle} color="destructive" />
          <SeverityCard label="Modérés" count={counts.medium} icon={Activity} color="warning" />
          <SeverityCard label="Information" count={counts.low} icon={CheckCircle2} color="success" />
        </div>

        <section className="mt-8 rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Sévérité</th>
                <th className="px-5 py-3">Ligne</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Message</th>
                <th className="px-5 py-3">Depuis</th>
                <th className="px-5 py-3">Impact</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((i) => (
                <tr key={i.id} className="border-t border-border">
                  <td className="px-5 py-4"><SeverityDot severity={i.severity} /></td>
                  <td className="px-5 py-4"><LineBadge line={i.line} /></td>
                  <td className="px-5 py-4 font-medium">{i.type}</td>
                  <td className="px-5 py-4 text-muted-foreground">{i.message}</td>
                  <td className="px-5 py-4 tabular-nums text-muted-foreground">{i.since}</td>
                  <td className="px-5 py-4 font-semibold tabular-nums">{i.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-foreground p-5 text-xs leading-relaxed text-background">
            <div className="mb-2 text-[10px] uppercase tracking-wider opacity-60">Cypher · stations anormalement chargées</div>
<pre className="whitespace-pre-wrap">{`MATCH (s:Station)<-[:A_QUAI]-(t:Trafic)
WHERE t.occupation > 0.8
  AND t.timestamp > datetime() - duration({minutes:5})
RETURN s.name, t.occupation, t.timestamp
ORDER BY t.occupation DESC;`}</pre>
          </div>
          <div className="rounded-2xl border border-border bg-foreground p-5 text-xs leading-relaxed text-background">
            <div className="mb-2 text-[10px] uppercase tracking-wider opacity-60">Cypher · tronçons impactés</div>
<pre className="whitespace-pre-wrap">{`MATCH (i:Incident {status:'ACTIF'})-[:AFFECTE]->(l:LINK)
MATCH (a:Station)-[l]->(b:Station)
RETURN a.name, b.name,
       l.temps_moyen AS habituel,
       l.temps_moyen * 2 AS estime;`}</pre>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function SeverityCard({ label, count, icon: Icon, color }: { label: string; count: number; icon: any; color: "destructive" | "warning" | "success" }) {
  const cls = {
    destructive: "bg-destructive/10 text-destructive",
    warning: "bg-warning/15 text-warning-foreground",
    success: "bg-success/15 text-success-foreground",
  }[color];
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${cls}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 font-display text-3xl font-semibold tabular-nums">{count}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function SeverityDot({ severity }: { severity: "high" | "medium" | "low" }) {
  const map = {
    high: { color: "bg-destructive", label: "Critique" },
    medium: { color: "bg-warning", label: "Modéré" },
    low: { color: "bg-success", label: "Info" },
  }[severity];
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${map.color}`} />
      <span className="text-xs">{map.label}</span>
    </span>
  );
}
