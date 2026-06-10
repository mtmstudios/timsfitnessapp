import { Link, useLocation } from "@tanstack/react-router";
import { Home, Calendar, Dumbbell, BarChart3, BookOpen } from "lucide-react";
import type { ReactNode } from "react";

const tabs: { to: string; label: string; icon: typeof Home; exact?: boolean }[] = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/plan", label: "Plan", icon: Calendar },
  { to: "/exercises", label: "Übungen", icon: BookOpen },
  { to: "/progress", label: "Fortschritt", icon: BarChart3 },
  { to: "/mobility", label: "Mobility", icon: Dumbbell },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-sidebar md:p-6">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <Logo />
          <span className="font-display text-xl font-bold tracking-tight">ATLAS</span>
        </Link>
        <nav className="flex flex-col gap-1">
          {tabs.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {t.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 pb-24 md:pb-8">
        <div className="mx-auto w-full max-w-3xl px-4 pt-6 md:px-8 md:pt-10">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {tabs.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function Logo() {
  return (
    <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
      <Dumbbell className="h-5 w-5" />
    </div>
  );
}