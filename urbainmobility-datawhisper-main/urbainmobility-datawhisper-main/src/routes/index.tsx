import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowRight, Activity, Route as RouteIcon, MapPin, Database, Sparkles, Zap, Shield } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Features />
      <UseCases />
      <DataSection />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="grid-bg absolute inset-0 opacity-60" />
      <div
        className="absolute inset-0 opacity-30"
        style={{ background: "radial-gradient(60% 50% at 70% 20%, color-mix(in oklab, var(--primary) 40%, transparent), transparent)" }}
      />
      <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Propulsé par Neo4j Aura · Données IDFM ouvertes
        </div>
        <h1 className="mt-6 max-w-4xl text-5xl font-bold tracking-tight text-foreground lg:text-7xl">
          La mobilité urbaine est <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-hero)" }}>un graphe</span>.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          GraphMobility modélise stations, lignes, correspondances et incidents dans Neo4j pour
          calculer des itinéraires multimodaux, détecter des anomalies en temps réel et
          mesurer l'accessibilité territoriale.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            to="/itineraire"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-primary-foreground shadow-elevated transition-transform hover:scale-[1.02]"
            style={{ background: "var(--gradient-hero)" }}
          >
            Calculer un itinéraire <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/incidents"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            Voir le centre d'incidents
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat value="14→2 min" label="Détection d'incident" />
          <Stat value="< 50 ms" label="Plus court chemin" />
          <Stat value="GTFS" label="IDFM · SNCF · RATP" />
          <Stat value="Aura" label="Neo4j Cloud" />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="font-display text-2xl font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function Features() {
  const features = [
    { icon: RouteIcon, title: "Itinéraires multimodaux", desc: "Dijkstra et Quantified Path Patterns avec contraintes spatiales et horaires." },
    { icon: Activity, title: "Détection d'incidents", desc: "Patterns invisibles aux capteurs : anomalies de flux et propagation sur le graphe." },
    { icon: MapPin, title: "Accessibilité territoriale", desc: "Score d'isochrone, zones mal desservies, transport à la demande (DRT)." },
    { icon: Database, title: "Import GTFS natif", desc: "stops.txt, trips.txt, stop_times.txt vers nœuds et relations." },
    { icon: Zap, title: "Temps réel", desc: "Streaming d'événements via drivers Neo4j et server functions TanStack." },
    { icon: Shield, title: "Jumeau numérique", desc: "Simulez fermetures et perturbations avant qu'elles ne surviennent." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="max-w-2xl">
        <h2 className="text-4xl font-bold tracking-tight">Tout ce que Neo4j apporte au transport.</h2>
        <p className="mt-3 text-muted-foreground">
          Là où les bases relationnelles peinent à modéliser des millions de connexions, le graphe excelle.
        </p>
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-elevated"
          >
            <div
              className="absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity group-hover:opacity-40"
              style={{ background: "var(--gradient-hero)" }}
            />
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function UseCases() {
  const cases = [
    { who: "Transport for London", what: "Détection d'incidents passée de 14-17 min à 1-2 min." },
    { who: "Network Rail (UK)", what: "Calcul d'itinéraires multimodaux temps réel sur tout le réseau ferré." },
    { who: "Royan, France", what: "Modélisation du transport à la demande (DRT) pour zones rurales." },
    { who: "Recherche académique", what: "Matching covoiturage temps réel via Neo4j Spatial + TimeTree." },
  ];
  return (
    <section className="border-y border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-4xl font-bold tracking-tight">Cas d'usage validés.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {cases.map((c) => (
            <div key={c.who} className="rounded-2xl border border-border bg-card p-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">{c.who}</div>
              <p className="mt-2 text-foreground">{c.what}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DataSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="rounded-3xl border border-border p-8 lg:p-12" style={{ background: "var(--gradient-card)" }}>
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight lg:text-4xl">Données officielles France.</h2>
            <p className="mt-4 text-muted-foreground">
              Le démonstrateur intègre des données ouvertes (IDFM, SNCF, RATP, OpenStreetMap)
              via <a className="text-primary underline" href="https://transport.data.gouv.fr" target="_blank" rel="noreferrer">transport.data.gouv.fr</a>.
              Format GTFS converti en graphe : Stops → Stations, Trips → Courses, StopTimes → Arrêts.
            </p>
            <Link
              to="/donnees"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Voir les sources et le schéma <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <pre className="overflow-x-auto rounded-xl bg-foreground p-5 text-xs leading-relaxed text-background">
{`// Import GTFS dans Neo4j
LOAD CSV WITH HEADERS FROM 'file:///stops.txt' AS row
CREATE (:Stop {
  id: row.stop_id,
  name: row.stop_name,
  location: point({
    latitude: toFloat(row.stop_lat),
    longitude: toFloat(row.stop_lon)
  })
});

// Plus court chemin pondéré
MATCH (a:Station {name:'Châtelet'}),
      (b:Station {name:'CDG T2'})
CALL gds.shortestPath.dijkstra.stream(...)
YIELD nodeIds, totalCost
RETURN totalCost AS seconds;`}
          </pre>
        </div>
      </div>
    </section>
  );
}
