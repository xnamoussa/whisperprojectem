// Petit jeu de démo Île-de-France inspiré des données IDFM (transport.data.gouv.fr).
// Sert de fallback quand Neo4j n'est pas encore branché.

export type DemoStation = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  zone: number;
  lines: string[];
};

export type DemoLink = {
  from: string;
  to: string;
  line: string;
  duration: number; // en secondes
  distance: number; // en km
};

export const DEMO_STATIONS: DemoStation[] = [
  { id: "chatelet", name: "Châtelet", lat: 48.8584, lon: 2.3470, zone: 1, lines: ["1", "4", "RER A"] },
  { id: "gare-de-lyon", name: "Gare de Lyon", lat: 48.8443, lon: 2.3735, zone: 1, lines: ["1", "14", "RER A"] },
  { id: "nation", name: "Nation", lat: 48.8482, lon: 2.3958, zone: 1, lines: ["1", "RER A"] },
  { id: "la-defense", name: "La Défense", lat: 48.8918, lon: 2.2382, zone: 3, lines: ["1", "RER A"] },
  { id: "etoile", name: "Charles de Gaulle – Étoile", lat: 48.8738, lon: 2.2950, zone: 1, lines: ["1", "RER A"] },
  { id: "concorde", name: "Concorde", lat: 48.8656, lon: 2.3212, zone: 1, lines: ["1"] },
  { id: "saint-lazare", name: "Saint-Lazare", lat: 48.8754, lon: 2.3250, zone: 1, lines: ["14"] },
  { id: "olympiades", name: "Olympiades", lat: 48.8273, lon: 2.3666, zone: 1, lines: ["14"] },
  { id: "bercy", name: "Bercy", lat: 48.8398, lon: 2.3795, zone: 1, lines: ["14"] },
  { id: "montparnasse", name: "Montparnasse", lat: 48.8421, lon: 2.3219, zone: 1, lines: ["4"] },
  { id: "barbes", name: "Barbès", lat: 48.8841, lon: 2.3492, zone: 1, lines: ["4"] },
  { id: "porte-orleans", name: "Porte d'Orléans", lat: 48.8232, lon: 2.3258, zone: 2, lines: ["4"] },
  { id: "cdg-airport", name: "Aéroport CDG T2", lat: 49.0034, lon: 2.5708, zone: 5, lines: ["RER B"] },
  { id: "gare-du-nord", name: "Gare du Nord", lat: 48.8809, lon: 2.3553, zone: 1, lines: ["4", "RER B"] },
  { id: "denfert", name: "Denfert-Rochereau", lat: 48.8336, lon: 2.3324, zone: 1, lines: ["4", "RER B"] },
  { id: "versailles", name: "Versailles Château", lat: 48.8014, lon: 2.1356, zone: 4, lines: ["RER C"] },
  { id: "invalides", name: "Invalides", lat: 48.8617, lon: 2.3148, zone: 1, lines: ["RER C"] },
];

export const DEMO_LINKS: DemoLink[] = [
  // Ligne 1
  { from: "la-defense", to: "etoile", line: "1", duration: 360, distance: 4.5 },
  { from: "etoile", to: "concorde", line: "1", duration: 180, distance: 1.9 },
  { from: "concorde", to: "chatelet", line: "1", duration: 240, distance: 2.1 },
  { from: "chatelet", to: "gare-de-lyon", line: "1", duration: 180, distance: 1.7 },
  { from: "gare-de-lyon", to: "nation", line: "1", duration: 240, distance: 2.5 },
  // Ligne 4
  { from: "barbes", to: "gare-du-nord", line: "4", duration: 120, distance: 0.7 },
  { from: "gare-du-nord", to: "chatelet", line: "4", duration: 240, distance: 2.0 },
  { from: "chatelet", to: "montparnasse", line: "4", duration: 360, distance: 3.4 },
  { from: "montparnasse", to: "denfert", line: "4", duration: 180, distance: 1.5 },
  { from: "denfert", to: "porte-orleans", line: "4", duration: 180, distance: 1.6 },
  // Ligne 14
  { from: "saint-lazare", to: "chatelet", line: "14", duration: 240, distance: 2.5 },
  { from: "chatelet", to: "gare-de-lyon", line: "14", duration: 180, distance: 1.7 },
  { from: "gare-de-lyon", to: "bercy", line: "14", duration: 120, distance: 0.9 },
  { from: "bercy", to: "olympiades", line: "14", duration: 240, distance: 2.3 },
  // RER A
  { from: "la-defense", to: "etoile", line: "RER A", duration: 240, distance: 4.5 },
  { from: "etoile", to: "chatelet", line: "RER A", duration: 240, distance: 4.0 },
  { from: "chatelet", to: "gare-de-lyon", line: "RER A", duration: 120, distance: 1.7 },
  { from: "gare-de-lyon", to: "nation", line: "RER A", duration: 180, distance: 2.5 },
  // RER B
  { from: "cdg-airport", to: "gare-du-nord", line: "RER B", duration: 1800, distance: 25.0 },
  { from: "gare-du-nord", to: "chatelet", line: "RER B", duration: 180, distance: 2.0 },
  { from: "chatelet", to: "denfert", line: "RER B", duration: 360, distance: 3.5 },
  // RER C
  { from: "invalides", to: "versailles", line: "RER C", duration: 1500, distance: 18.0 },
];

export const DEMO_INCIDENTS = [
  { id: "i1", line: "RER A", station: "chatelet", severity: "high" as const, type: "Affluence", message: "Affluence exceptionnelle quai direction Boissy", since: "12 min", impact: "+8 min" },
  { id: "i2", line: "4", station: "barbes", severity: "medium" as const, type: "Régulation", message: "Trafic ralenti sur l'ensemble de la ligne", since: "5 min", impact: "+4 min" },
  { id: "i3", line: "RER B", station: "cdg-airport", severity: "low" as const, type: "Information", message: "Travaux nuit prévus dimanche", since: "2 h", impact: "—" },
  { id: "i4", line: "1", station: "la-defense", severity: "medium" as const, type: "Incident voyageur", message: "Intervention en cours", since: "8 min", impact: "+6 min" },
];

// Recherche de plus court chemin (Dijkstra simple sur le graphe démo)
export function demoShortestPath(fromId: string, toId: string) {
  const graph = new Map<string, { to: string; line: string; duration: number; distance: number }[]>();
  for (const s of DEMO_STATIONS) graph.set(s.id, []);
  for (const l of DEMO_LINKS) {
    graph.get(l.from)?.push({ to: l.to, line: l.line, duration: l.duration, distance: l.distance });
    graph.get(l.to)?.push({ to: l.from, line: l.line, duration: l.duration, distance: l.distance });
  }
  const dist = new Map<string, number>();
  const prev = new Map<string, { node: string; line: string; distance: number; duration: number } | null>();
  for (const s of DEMO_STATIONS) {
    dist.set(s.id, Infinity);
    prev.set(s.id, null);
  }
  dist.set(fromId, 0);
  const queue = new Set(DEMO_STATIONS.map((s) => s.id));
  while (queue.size > 0) {
    let u: string | null = null;
    let best = Infinity;
    for (const id of queue) {
      const d = dist.get(id) ?? Infinity;
      if (d < best) { best = d; u = id; }
    }
    if (!u || best === Infinity) break;
    queue.delete(u);
    if (u === toId) break;
    for (const edge of graph.get(u) ?? []) {
      if (!queue.has(edge.to)) continue;
      const alt = best + edge.duration;
      if (alt < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, alt);
        prev.set(edge.to, { node: u, line: edge.line, distance: edge.distance, duration: edge.duration });
      }
    }
  }
  const path: { stationId: string; name: string; line?: string; duration?: number; distance?: number }[] = [];
  let cur: string | null = toId;
  let totalDistance = 0;
  while (cur) {
    const station = DEMO_STATIONS.find((s) => s.id === cur)!;
    const p = prev.get(cur);
    path.unshift({ stationId: cur, name: station.name, line: p?.line, duration: p?.duration, distance: p?.distance });
    if (p?.distance) totalDistance += p.distance;
    cur = p?.node ?? null;
  }
  return {
    found: dist.get(toId) !== Infinity,
    totalSeconds: dist.get(toId) ?? 0,
    totalDistance,
    steps: path,
  };
}
