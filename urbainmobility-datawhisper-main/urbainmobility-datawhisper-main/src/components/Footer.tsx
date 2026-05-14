export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40 mt-20">
      <div className="mx-auto max-w-7xl px-6 py-10 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p>
            GraphMobility — démonstrateur basé sur <span className="font-medium text-foreground">Neo4j</span> et données ouvertes
            <a href="https://transport.data.gouv.fr" target="_blank" rel="noreferrer" className="ml-1 text-primary hover:underline">transport.data.gouv.fr</a>.
          </p>
          <p>Inspiré des cas TfL, IDFM, SNCF Open Data.</p>
        </div>
      </div>
    </footer>
  );
}
