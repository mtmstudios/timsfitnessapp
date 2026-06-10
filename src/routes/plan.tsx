import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CategoryBadge } from "@/components/CategoryBadge";
import { weeklyPlan, weekdaysLong, getWorkout } from "@/data/workouts";
import { loadState, markCompleted, unmarkCompleted } from "@/lib/storage";

export const Route = createFileRoute("/plan")({
  head: () => ({ meta: [{ title: "Wochenplan — Atlas" }] }),
  component: Plan,
});

function Plan() {
  const [done, setDone] = useState<Set<string>>(new Set());
  useEffect(() => {
    const s = loadState();
    setDone(new Set(Object.keys(s.completed).map((k) => k.split("-").pop()!)));
  }, []);

  function toggle(day: string, workoutId: string) {
    if (done.has(day)) { unmarkCompleted(day); }
    else { markCompleted(day, workoutId); }
    const next = new Set(done);
    if (done.has(day)) next.delete(day); else next.add(day);
    setDone(next);
  }

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Wochenplan</h1>
        <p className="mt-1 text-sm text-muted-foreground">2× Kraft · 2× Lauf · 1× Athletik · Mobility</p>
      </header>
      <div className="space-y-3">
        {weeklyPlan.map((entry, i) => {
          const w = getWorkout(entry.workoutId);
          const isDone = done.has(entry.day);
          return (
            <div key={entry.day} className="rounded-2xl border border-border bg-card p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{weekdaysLong[i]}</span>
                    {entry.optional && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">optional</span>
                    )}
                  </div>
                  <h3 className="mt-1 truncate font-display text-lg font-bold">{w.title}</h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <CategoryBadge category={w.category} />
                    <span className="text-xs text-muted-foreground">⏱ {w.duration}</span>
                    <span className="text-xs text-muted-foreground">🔥 {w.intensity}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{w.goal}</p>
                </div>
                <button
                  onClick={() => toggle(entry.day, w.id)}
                  aria-label={isDone ? "Erledigt zurücksetzen" : "Als erledigt markieren"}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
                >
                  {isDone
                    ? <CheckCircle2 className="h-7 w-7 text-primary" />
                    : <Circle className="h-7 w-7 text-muted-foreground" />}
                </button>
              </div>
              <Link
                to="/training/$id"
                params={{ id: w.id }}
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary"
              >
                Training ansehen <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}