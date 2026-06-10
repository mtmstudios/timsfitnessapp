import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Play, ChevronLeft, Clock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CategoryBadge } from "@/components/CategoryBadge";
import { ExerciseAnimation } from "@/components/ExerciseAnimation";
import { getWorkout } from "@/data/workouts";
import { getExercise } from "@/data/exercises";

export const Route = createFileRoute("/training/$id/")({
  head: ({ params }) => ({ meta: [{ title: `${getWorkout(params.id)?.title ?? "Training"} — Atlas` }] }),
  component: TrainingDetail,
  notFoundComponent: () => (
    <AppShell>
      <p>Training nicht gefunden.</p>
    </AppShell>
  ),
});

function TrainingDetail() {
  const { id } = Route.useParams();
  const w = getWorkout(id);
  if (!w) throw notFound();

  return (
    <AppShell>
      <Link to="/plan" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="h-4 w-4" /> Wochenplan
      </Link>

      <header className="rounded-3xl border border-border bg-card p-6" style={{ backgroundImage: "var(--gradient-hero)" }}>
        <CategoryBadge category={w.category} />
        <h1 className="mt-2 font-display text-3xl font-bold">{w.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{w.goal}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4 text-muted-foreground" /> {w.duration}</span>
          <span>🔥 Intensität {w.intensity}</span>
        </div>
        <Link
          to="/training/$id/start"
          params={{ id: w.id }}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
        >
          <Play className="h-4 w-4" /> Training starten
        </Link>
      </header>

      <div className="mt-6 space-y-6">
        {w.blocks.map((block, bi) => (
          <section key={bi}>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-xl font-bold">{block.title}</h2>
              {block.rounds && <span className="text-xs text-muted-foreground">{block.rounds} Runden</span>}
            </div>
            {block.description && (
              <p className="mb-3 text-sm text-muted-foreground">{block.description}</p>
            )}
            <div className="space-y-2">
              {block.items.map((item, i) => {
                const ex = getExercise(item.exerciseId);
                if (!ex) return null;
                return (
                  <Link
                    key={i}
                    to="/exercises/$id"
                    params={{ id: ex.id }}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition hover:border-primary/40"
                  >
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
                      <ExerciseAnimation type={ex.animation} size={48} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{ex.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[
                          item.sets && `${item.sets} Sätze`,
                          item.reps && `${item.reps} Wdh`,
                          item.duration,
                          item.rest && `Pause ${item.rest}`,
                        ].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        {w.category === "cardio" && (
          <Link to="/run" className="block rounded-2xl border border-border bg-card p-4 text-center font-semibold text-primary">
            Lauf-Timer öffnen →
          </Link>
        )}
      </div>
    </AppShell>
  );
}