import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CategoryBadge } from "@/components/CategoryBadge";
import { ExerciseAnimation } from "@/components/ExerciseAnimation";
import { getExercise } from "@/data/exercises";

export const Route = createFileRoute("/exercises/$id")({
  head: ({ params }) => ({ meta: [{ title: `${getExercise(params.id)?.name ?? "Übung"} — Atlas` }] }),
  component: ExerciseDetail,
  notFoundComponent: () => <AppShell><p>Übung nicht gefunden.</p></AppShell>,
});

function ExerciseDetail() {
  const { id } = Route.useParams();
  const ex = getExercise(id);
  if (!ex) throw notFound();

  return (
    <AppShell>
      <Link to="/exercises" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="h-4 w-4" /> Bibliothek
      </Link>

      <div className="grid place-items-center rounded-3xl border border-border bg-card py-8" style={{ backgroundImage: "var(--gradient-hero)" }}>
        <ExerciseAnimation type={ex.animation} size={240} color="var(--primary)" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <CategoryBadge category={ex.category} />
        <span className="text-xs text-muted-foreground capitalize">{ex.difficulty}</span>
      </div>
      <h1 className="mt-2 font-display text-3xl font-bold">{ex.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{ex.muscles.join(" · ")}</p>
      {ex.equipment.length > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">Equipment: {ex.equipment.join(", ")}</p>
      )}

      <section className="mt-6">
        <h2 className="font-display text-lg font-bold">Ausführung</h2>
        <ol className="mt-2 space-y-2 text-sm">
          {ex.execution.map((s, i) => (
            <li key={i} className="flex gap-3 rounded-xl border border-border bg-card p-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </section>

      {ex.mistakes.length > 0 && (
        <section className="mt-6">
          <h2 className="font-display text-lg font-bold">Häufige Fehler</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {ex.mistakes.map((m, i) => <li key={i}>✕ {m}</li>)}
          </ul>
        </section>
      )}

      {ex.tips.length > 0 && (
        <section className="mt-6">
          <h2 className="font-display text-lg font-bold">Tipps</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {ex.tips.map((m, i) => <li key={i}>✓ {m}</li>)}
          </ul>
        </section>
      )}

      {ex.alternatives.length > 0 && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-4">
          <h2 className="font-display text-lg font-bold">Alternativen</h2>
          <p className="mt-1 text-sm text-muted-foreground">Falls Gerät besetzt oder ungeeignet:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ex.alternatives.map((a) => (
              <span key={a} className="rounded-full bg-secondary px-3 py-1 text-xs">{a}</span>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}