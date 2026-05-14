import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ExternalLink, Database, FileCode, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { neo4jStatus } from "@/lib/mobility.functions";

export const Route = createFileRoute("/donnees")({
  component: DonneesPage,
  head: () => ({
    meta: [
      { title: "Données — GraphMobility" },
      { name: "description", content: "Sources de données ouvertes France et schéma graphe Neo4j pour la mobilité." },
    ],
  }),
});

function Neo4jStatusCard() {
  const fn = useServerFn(neo4jStatus);
  const q = useQuery({ queryKey: ["neo4j-status"], queryFn: () => fn(), refetchInterval: 30000 });
  const d = q.data;
  const ok = d?.connected && (d?.stations ?? 0) > 0;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Database className="h-3.5 w-3.5" /> Instance Neo4j Aura
      </div>
      <div className="mt-3 flex items-center gap-3">
        {q.isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : ok ? (
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
        ) : (
          <AlertCircle className="h-6 w-6 text-amber-500" />
        )}
        <div>
          <div className="font-semibold">
            {q.isLoading ? "Vérification…" : ok ? "Connecté · données réelles" : d?.configured ? "Connecté, base vide" : "Non configurée"}
          </div>
          <div className="text-xs text-muted-foreground">
            {ok
              ? `${d?.stations.toLocaleString()} stations · ${d?.links.toLocaleString()} relations LINK`
              : "Lance `node scripts/import-gtfs.mjs` pour pousser le GTFS IDFM."}
          </div>
        </div>
      </div>
    </div>
  );
}

const SOURCES = [
  { name: "transport.data.gouv.fr", desc: "Point national d'accès aux données ouvertes de mobilité (GTFS, GBFS, NeTEx).", url: "https://transport.data.gouv.fr" },
  { name: "IDFM Open Data", desc: "Île-de-France Mobilités : 70+ jeux de données dont GTFS Île-de-France complet.", url: "https://data.iledefrance-mobilites.fr" },
  { name: "SNCF Open Data", desc: "Horaires théoriques et temps réel TER, Intercités, TGV.", url: "https://ressources.data.sncf.com" },
  { name: "RATP Open Data", desc: "Réseau métro, RER, bus, tram parisien et accessibilité.", url: "https://data.ratp.fr" },
  { name: "data.gouv.fr", desc: "Portail open data national — incidents, comptages, accidentologie.", url: "https://data.gouv.fr" },
];

function DonneesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight">Données & schéma graphe</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Toutes les données utilisables proviennent de sources officielles françaises ouvertes,
          puis converties en graphe Neo4j.
        </p>

        <section className="mt-8">
          <Neo4jStatusCard />
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold">Sources officielles</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {SOURCES.map((s) => (
              <a key={s.name} href={s.url} target="_blank" rel="noreferrer" className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-secondary">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{s.name}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold">Modèle de données</h2>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-foreground p-6 text-xs leading-relaxed text-background">
{`(:Station {name, lat, lon, zone})
   ├─[:LINK {distance, temps_moyen, restriction}]→(:Station)
   ├─[:DESSERVIE_PAR {ordre}]→(:Ligne {nom, type, operateur})
   └─[:PROCHE]→(:POI {type, nom})

(:Arret {horaire})─[:DE]→(:Station)
   └─[:APPARTIENT_A]→(:Course {train_id, depart})

(:Incident {status, type, severity})─[:AFFECTE]→(:LINK)`}
          </pre>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold">Pipeline d'import GTFS</h2>
          <div className="mt-4 grid gap-3">
            {["stops.txt → Stop", "routes.txt → Ligne", "trips.txt → Course", "stop_times.txt → Arret/STOP_AT", "transfers.txt → CORRESPONDANCE"].map((line, i) => (
              <div key={line} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
                <FileCode className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">{line}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-border p-8" style={{ background: "var(--gradient-card)" }}>
          <h3 className="font-display text-xl font-semibold">Branchez votre instance Neo4j Aura</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Le démonstrateur utilise un mini-graphe IDF embarqué. Pour passer en données réelles,
            créez une instance Neo4j Aura, puis configurez les variables d'environnement
            <code className="mx-1 rounded bg-card px-1.5 py-0.5 text-xs">NEO4J_URI</code>,
            <code className="mx-1 rounded bg-card px-1.5 py-0.5 text-xs">NEO4J_USER</code>,
            <code className="mx-1 rounded bg-card px-1.5 py-0.5 text-xs">NEO4J_PASSWORD</code>
            côté serveur Lovable Cloud.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
