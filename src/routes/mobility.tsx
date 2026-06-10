import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ExerciseAnimation } from "@/components/ExerciseAnimation";
import { getWorkout } from "@/data/workouts";
import { getExercise } from "@/data/exercises";

export const Route = createFileRoute("/mobility")({
  head: () => ({ meta: [{ title: "Mobility — Atlas" }] }),
  component: Mobility,
});

function Mobility() {
  const mini = getWorkout("regeneration");
  const sonntag = getWorkout("sonntag-mobility");

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Mobility</h1>
        <p className="mt-1 text-sm text-muted-foreground">Beweglichkeit, Regeneration, Reset.</p>
      </header>

      <Section workout={mini} title="Mini-Mobility (10–15 min)" />
      <div className="h-6" />
      <Section workout={sonntag} title="Sonntag-Flow (15 min)" />
    </AppShell>
  );
}

function Section({ workout, title }: { workout: ReturnType<typeof getWorkout>; title: string }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <Link
          to="/training/$id"
          params={{ id: workout.id }}
          className="text-sm font-semibold text-primary"
        >
          Starten →
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        {workout.blocks[0].items.map((it, i) => {
          const ex = getExercise(it.exerciseId);
          if (!ex) return null;
          return (
            <Link
              key={i}
              to="/exercises/$id"
              params={{ id: ex.id }}
              className="rounded-2xl border border-border bg-background p-3 text-center"
            >
              <div className="grid place-items-center text-[color:var(--cat-mobility)]">
                <ExerciseAnimation type={ex.animation} size={90} />
              </div>
              <p className="mt-1 text-xs font-semibold">{ex.name}</p>
              <p className="text-[10px] text-muted-foreground">{it.duration ?? it.reps}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
