import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DEMO_STATIONS, DEMO_INCIDENTS, demoShortestPath } from "./demo-network";
import { cypher, neo4jConfigured } from "./neo4j-http.server";

const RouteInput = z.object({
  fromId: z.string().min(1).max(64),
  toId: z.string().min(1).max(64),
});

// ─────────────────────────────────────────────── Stations

export const listStations = createServerFn({ method: "GET" }).handler(async () => {
  if (neo4jConfigured()) {
    try {
      const rows = await cypher<{ id: string; name: string; lat: number | null; lon: number | null; lines: string[] }>(
        `MATCH (s:Station)
         OPTIONAL MATCH (s)-[l:LINK]-()
         WITH s, collect(DISTINCT l.route) AS routes
         WHERE size(routes) > 0
         RETURN s.id AS id, s.name AS name, s.lat AS lat, s.lon AS lon, routes AS lines
         ORDER BY name LIMIT 5000`,
      );
      if (rows.length) {
        return {
          source: "neo4j" as const,
          stations: rows.map((r) => ({
            id: r.id,
            name: r.name,
            lat: r.lat ?? 48.86,
            lon: r.lon ?? 2.35,
            zone: 1,
            lines: r.lines ?? [],
          })),
        };
      }
    } catch (e) {
      console.error("listStations Neo4j fallback:", (e as Error).message);
    }
  }
  return { stations: DEMO_STATIONS, source: "demo" as const };
});

// ─────────────────────────────────────────────── Itinéraire

export const computeRoute = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => RouteInput.parse(data))
  .handler(async ({ data }) => {
    if (neo4jConfigured()) {
      try {
        // APOC Dijkstra (disponible sur Aura). Poids = temps_moyen (secondes).
        const rows = await cypher<{ nodeIds: string[]; weight: number; routes: string[] }>(
          `MATCH (a:Station {id: $from}), (b:Station {id: $to})
           CALL apoc.algo.dijkstra(a, b, 'LINK>|LINK<', 'temps_moyen') YIELD path, weight
           WITH path, weight,
                [n IN nodes(path) | n.id] AS nodeIds,
                [r IN relationships(path) | r.route] AS routes
           RETURN nodeIds, weight, routes LIMIT 1`,
          { from: data.fromId, to: data.toId },
        );
        if (rows.length) {
          const r = rows[0];
          // Récupère les noms / coords pour la timeline
          const stationDetails = await cypher<{ id: string; name: string; lat: number; lon: number }>(
            `MATCH (s:Station) WHERE s.id IN $ids
             RETURN s.id AS id, s.name AS name, s.lat AS lat, s.lon AS lon`,
            { ids: r.nodeIds },
          );
          const byId = new Map(stationDetails.map((s) => [s.id, s]));
          const steps = r.nodeIds.map((id, i) => {
            const s = byId.get(id);
            const line = i === 0 ? undefined : r.routes[i - 1];
            return {
              stationId: id,
              name: s?.name ?? id,
              line,
              duration: undefined as number | undefined,
            };
          });
          return {
            source: "neo4j" as const,
            found: true,
            totalSeconds: Math.round(r.weight),
            totalDistance: estimateDistance(r.nodeIds, byId),
            steps,
          };
        }
        return { source: "neo4j" as const, found: false, totalSeconds: 0, totalDistance: 0, steps: [] };
      } catch (e) {
        console.error("computeRoute Neo4j fallback:", (e as Error).message);
      }
    }
    const result = demoShortestPath(data.fromId, data.toId);
    return { ...result, source: "demo" as const };
  });

function estimateDistance(ids: string[], byId: Map<string, { lat: number; lon: number }>) {
  let total = 0;
  for (let i = 0; i < ids.length - 1; i++) {
    const a = byId.get(ids[i]);
    const b = byId.get(ids[i + 1]);
    if (!a || !b) continue;
    total += haversine(a.lat, a.lon, b.lat, b.lon);
  }
  return total;
}
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ─────────────────────────────────────────────── Incidents (démo pour l'instant)

export const listIncidents = createServerFn({ method: "GET" }).handler(async () => {
  return { incidents: DEMO_INCIDENTS, source: "demo" as const };
});

// ─────────────────────────────────────────────── Accessibilité

export const accessibilityScores = createServerFn({ method: "GET" }).handler(async () => {
  if (neo4jConfigured()) {
    try {
      const rows = await cypher<{ id: string; name: string; lines: string[]; degree: number }>(
        `MATCH (s:Station)-[l:LINK]-()
         WITH s, collect(DISTINCT l.route) AS lines, count(l) AS degree
         RETURN s.id AS id, s.name AS name, lines, degree
         ORDER BY degree DESC LIMIT 80`,
      );
      if (rows.length) {
        const scored = rows.map((r) => ({
          id: r.id,
          name: r.name,
          zone: 1,
          score: Math.min(100, (r.lines?.length ?? 0) * 18 + Math.min(40, r.degree)),
          lines: r.lines ?? [],
        }));
        return { scored, source: "neo4j" as const };
      }
    } catch (e) {
      console.error("accessibilityScores Neo4j fallback:", (e as Error).message);
    }
  }
  const scored = DEMO_STATIONS.map((s) => ({
    id: s.id,
    name: s.name,
    zone: s.zone,
    score: Math.min(100, s.lines.length * 22 + (s.zone === 1 ? 30 : 10)),
    lines: s.lines,
  })).sort((a, b) => b.score - a.score);
  return { scored, source: "demo" as const };
});

// ─────────────────────────────────────────────── Health

export const neo4jStatus = createServerFn({ method: "GET" }).handler(async () => {
  if (!neo4jConfigured()) return { configured: false, connected: false, stations: 0, links: 0 };
  try {
    const rows = await cypher<{ stations: number; links: number }>(
      `MATCH (s:Station) WITH count(s) AS stations
       OPTIONAL MATCH ()-[l:LINK]->() RETURN stations, count(l) AS links`,
    );
    const r = rows[0] ?? { stations: 0, links: 0 };
    return { configured: true, connected: true, stations: Number(r.stations), links: Number(r.links) };
  } catch (e) {
    return { configured: true, connected: false, error: (e as Error).message, stations: 0, links: 0 };
  }
});
