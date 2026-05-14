import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState, lazy, Suspense, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { listStations, computeRoute } from "@/lib/mobility.functions";
import { ArrowRight, Loader2, MapPin, Clock, Route as RouteIcon } from "lucide-react";

const RouteMap = lazy(() => import("@/components/RouteMap").then((m) => ({ default: m.RouteMap })));

export const Route = createFileRoute("/itineraire")({
  component: ItinerairePage,
  head: () => ({
    meta: [
      { title: "Itinéraire — GraphMobility" },
      { name: "description", content: "Calcul d'itinéraire multimodal sur graphe Neo4j (Île-de-France)." },
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

function ItinerairePage() {
  const fetchStations = useServerFn(listStations);
  const fetchRoute = useServerFn(computeRoute);

  const stationsQuery = useQuery({
    queryKey: ["stations"],
    queryFn: () => fetchStations(),
  });

  const [from, setFrom] = useState("la-defense");
  const [to, setTo] = useState("cdg-airport");
  const [submitted, setSubmitted] = useState<{ from: string; to: string } | null>({ from: "la-defense", to: "cdg-airport" });

  const routeQuery = useQuery({
    queryKey: ["route", submitted?.from, submitted?.to],
    queryFn: () => fetchRoute({ data: { fromId: submitted!.from, toId: submitted!.to } }),
    enabled: !!submitted && submitted.from !== submitted.to,
  });

  const stations = stationsQuery.data?.stations ?? [];

  const mapStops = useMemo<{ id: string; name: string; lat: number; lon: number; line?: string }[]>(() => {
    if (!routeQuery.data?.found) return [];
    const out: { id: string; name: string; lat: number; lon: number; line?: string }[] = [];
    for (const s of routeQuery.data.steps) {
      const station = stations.find((st) => st.id === s.stationId);
      if (!station) continue;
      out.push({ id: s.stationId, name: s.name, lat: station.lat, lon: station.lon, line: s.line });
    }
    return out;
  }, [routeQuery.data, stations]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight">Itinéraire multimodal</h1>
          <p className="mt-3 text-muted-foreground">
            Plus court chemin calculé en temps réel sur le graphe — Dijkstra pondéré par le temps de parcours.
          </p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); setSubmitted({ from, to }); }}
          className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft"
        >
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto]">
            <SelectField label="Départ" value={from} onChange={setFrom} stations={stations} />
            <div className="hidden self-end pb-3 text-muted-foreground md:block"><ArrowRight className="h-5 w-5" /></div>
            <SelectField label="Arrivée" value={to} onChange={setTo} stations={stations} />
            <button
              type="submit"
              disabled={routeQuery.isFetching}
              className="self-end inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-primary-foreground shadow-elevated transition-transform hover:scale-[1.02] disabled:opacity-60"
              style={{ background: "var(--gradient-hero)" }}
            >
              {routeQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RouteIcon className="h-4 w-4" />}
              Calculer
            </button>
          </div>
        </form>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div>
                  <h2 className="text-sm font-semibold tracking-wide">Carte du trajet</h2>
                  <p className="text-xs text-muted-foreground">OpenStreetMap · CARTO dark</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {routeQuery.data?.found ? `${routeQuery.data.steps.length} arrêts` : "—"}
                </span>
              </div>
              <div className="h-[420px] w-full">
                <ClientOnly fallback={<div className="flex h-full items-center justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>}>
                  <Suspense fallback={<div className="flex h-full items-center justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>}>
                    <RouteMap stops={mapStops} />
                  </Suspense>
                </ClientOnly>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold">Trajet recommandé</h2>
              {routeQuery.isLoading && <p className="mt-4 text-muted-foreground">Calcul…</p>}
              {routeQuery.data && !routeQuery.data.found && (
                <p className="mt-4 text-destructive">Aucun chemin trouvé entre ces stations dans le graphe démo.</p>
              )}
              {routeQuery.data && routeQuery.data.found && (
                <Timeline steps={routeQuery.data.steps} />
              )}
            </div>
          </div>
          <aside className="space-y-4">
            <Metric icon={Clock} label="Temps total" value={routeQuery.data ? formatDuration(routeQuery.data.totalSeconds) : "—"} />
            <Metric icon={MapPin} label="Distance" value={routeQuery.data ? `${routeQuery.data.totalDistance.toFixed(1)} km` : "—"} />
            <Metric icon={RouteIcon} label="Stations" value={routeQuery.data ? `${routeQuery.data.steps.length}` : "—"} />
            <CypherCard from={submitted?.from} to={submitted?.to} stations={stations} />
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function SelectField({ label, value, onChange, stations }: { label: string; value: string; onChange: (v: string) => void; stations: { id: string; name: string }[] }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {stations.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </label>
  );
}

function Timeline({ steps }: { steps: { stationId: string; name: string; line?: string; duration?: number }[] }) {
  return (
    <ol className="mt-6 space-y-0">
      {steps.map((s, i) => (
        <li key={s.stationId} className="relative flex gap-4 pb-6 last:pb-0">
          {i < steps.length - 1 && (
            <span className="absolute left-[11px] top-6 h-full w-0.5 bg-border" />
          )}
          <div className={`relative z-10 mt-1 h-6 w-6 shrink-0 rounded-full border-4 ${i === 0 || i === steps.length - 1 ? "border-primary bg-card" : "border-accent bg-card"}`} />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{s.name}</span>
              {s.line && <LineBadge line={s.line} />}
            </div>
            {s.duration && (
              <span className="text-xs text-muted-foreground">{Math.round(s.duration / 60)} min</span>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function LineBadge({ line }: { line: string }) {
  const palette: Record<string, string> = {
    "1": "bg-amber-400 text-amber-950",
    "4": "bg-fuchsia-400 text-fuchsia-950",
    "14": "bg-violet-500 text-white",
    "RER A": "bg-red-500 text-white",
    "RER B": "bg-blue-500 text-white",
    "RER C": "bg-yellow-400 text-yellow-950",
  };
  return <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${palette[line] ?? "bg-secondary text-foreground"}`}>{line}</span>;
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />{label}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}

function CypherCard({ from, to, stations }: { from?: string; to?: string; stations: { id: string; name: string }[] }) {
  const fromName = stations.find((s) => s.id === from)?.name ?? "…";
  const toName = stations.find((s) => s.id === to)?.name ?? "…";
  return (
    <div className="rounded-2xl border border-border bg-foreground p-4 text-xs leading-relaxed text-background">
      <div className="mb-2 text-[10px] uppercase tracking-wider opacity-60">Cypher exécuté</div>
<pre className="whitespace-pre-wrap">{`MATCH (a:Station {name:'${fromName}'}),
      (b:Station {name:'${toName}'})
CALL gds.shortestPath.dijkstra.stream(
  'transit',
  {sourceNode:a, targetNode:b,
   relationshipWeightProperty:'temps_moyen'}
) YIELD nodeIds, totalCost
RETURN nodeIds, totalCost;`}</pre>
    </div>
  );
}

function formatDuration(seconds: number) {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
}
