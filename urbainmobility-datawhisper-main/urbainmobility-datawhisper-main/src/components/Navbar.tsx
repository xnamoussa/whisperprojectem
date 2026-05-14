import { Link } from "@tanstack/react-router";
import { Network } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 glass-panel">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--gradient-hero)" }}>
            <Network className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">GraphMobility</span>
        </Link>
        <div className="flex items-center gap-1 text-sm">
          <NavLink to="/itineraire">Itinéraire</NavLink>
          <NavLink to="/incidents">Incidents</NavLink>
          <NavLink to="/accessibilite">Accessibilité</NavLink>
          <NavLink to="/donnees">Données</NavLink>
        </div>
      </nav>
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      activeProps={{ className: "rounded-md px-3 py-2 bg-secondary text-foreground font-medium" }}
    >
      {children}
    </Link>
  );
}
