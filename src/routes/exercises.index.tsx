import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CategoryBadge } from "@/components/CategoryBadge";
import { ExerciseAnimation } from "@/components/ExerciseAnimation";
import { exercises, categoryLabels, type ExerciseCategory } from "@/data/exercises";

export const Route = createFileRoute("/exercises/")({
  head: () => ({ meta: [{ title: "Übungsbibliothek — Atlas" }] }),
  component: Lib,
});

const cats: ExerciseCategory[] = ["strength", "dynamic", "core", "mobility", "cardio"];

function Lib() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<ExerciseCategory | "all">("all");

  const filtered = exercises.filter(
    (e) => (cat === "all" || e.category === cat) && e.name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AppShell>
      <header className="mb-5">
        <h1 className="font-display text-3xl font-bold">Übungen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {exercises.length} Übungen mit Animation
        </p>
      </header>

      <div className="sticky top-0 z-10 -mx-4 bg-background px-4 pb-3 pt-2 md:mx-0 md:px-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Übung suchen..."
            className="w-full rounded-full border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <Chip active={cat === "all"} onClick={() => setCat("all")}>
            Alle
          </Chip>
          {cats.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
              {categoryLabels[c]}
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {filtered.map((ex) => (
          <Link
            key={ex.id}
            to="/exercises/$id"
            params={{ id: ex.id }}
            className="group flex flex-col rounded-2xl border border-border bg-card p-3 transition hover:border-primary/40"
          >
            <div className="grid aspect-square place-items-center rounded-xl bg-background text-muted-foreground group-hover:text-primary">
              <ExerciseAnimation type={ex.animation} size={120} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <CategoryBadge category={ex.category} />
            </div>
            <p className="mt-1 text-sm font-semibold leading-tight">{ex.name}</p>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="mt-8 text-center text-sm text-muted-foreground">Keine Übungen gefunden.</p>
      )}
    </AppShell>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}
