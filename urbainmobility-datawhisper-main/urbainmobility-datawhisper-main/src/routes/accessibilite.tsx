import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { accessibilityScores } from "@/lib/mobility.functions";

export const Route = createFileRoute("/accessibilite")({
  component: AccessibilitePage,
  head: () => ({
    meta: [
      { title: "Accessibilité — GraphMobility" },
      { name: "description", content: "Mesure d'accessibilité territoriale et zones mal desservies via Neo4j." },
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

function AccessibilitePage() {
  const fn = useServerFn(accessibilityScores);
  const { data } = useQuery({ queryKey: ["access"], queryFn: () => fn() });
  const scored = data?.scored ?? [];
  const max = scored[0]?.score ?? 100;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight">Accessibilité territoriale</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Score basé sur le nombre de lignes desservies, la zone tarifaire et la connectivité dans le graphe.
          Méthodologie inspirée des recherches sur le calcul d'isochrones avec Neo4j.
        </p>

        <div className="mt-10 grid gap-3">
          {scored.map((s) => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{s.name}</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">Zone {s.zone}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{s.lines.join(" · ")}</div>
                </div>
                <div className="w-48">
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full" style={{ width: `${(s.score / max) * 100}%`, background: "var(--gradient-hero)" }} />
                  </div>
                  <div className="mt-1 text-right text-xs font-semibold tabular-nums">{s.score}/100</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-foreground p-5 text-xs leading-relaxed text-background">
          <div className="mb-2 text-[10px] uppercase tracking-wider opacity-60">Cypher · accessibilité depuis une zone</div>
<pre className="whitespace-pre-wrap">{`MATCH (c:Centroid {zone:$zoneId})-[w:WALK_TO]-(st:StopTime)
WITH c, min(st.departure_time) AS first_connection
MATCH (st:StopTime {departure_time:first_connection})
      -[:FOLLOWS*]->(dest:Stop)
RETURN c.id,
       count(DISTINCT dest) AS accessible_stops,
       avg(dest.importance) AS accessibilite;`}</pre>
        </div>
      </main>
      <Footer />
    </div>
  );
}
