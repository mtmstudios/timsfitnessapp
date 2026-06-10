import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, Check, SkipForward, RotateCcw, Award } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ExerciseAnimation } from "@/components/ExerciseAnimation";
import { RestTimer } from "@/components/Timer";
import { getWorkout } from "@/data/workouts";
import { findExerciseByName, getExercise } from "@/data/exercises";
import { addLog, markCompleted } from "@/lib/storage";
import { weeklyPlan } from "@/data/workouts";

export const Route = createFileRoute("/training/$id/start")({
  head: () => ({ meta: [{ title: "Training läuft — Atlas" }] }),
  component: TrainingMode,
  notFoundComponent: () => (
    <AppShell>
      <p>Nicht gefunden.</p>
    </AppShell>
  ),
});

interface FlatItem {
  exerciseId: string;
  label: string;
  rest?: string;
  block: string;
}

function TrainingMode() {
  const { id } = Route.useParams();
  const w = getWorkout(id);
  if (!w) throw notFound();
  const navigate = useNavigate();

  const flat: FlatItem[] = useMemo(() => {
    const out: FlatItem[] = [];
    for (const b of w.blocks) {
      const rounds = b.rounds ?? 1;
      for (let r = 0; r < rounds; r++) {
        for (const it of b.items) {
          out.push({
            exerciseId: it.exerciseId,
            label: [
              it.sets && `${it.sets}×${it.reps ?? it.duration}`,
              !it.sets && (it.reps ?? it.duration),
            ]
              .filter(Boolean)
              .join(" "),
            rest: it.rest,
            block: rounds > 1 ? `${b.title} – Runde ${r + 1}/${rounds}` : b.title,
          });
        }
      }
    }
    return out;
  }, [w]);

  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [rpe, setRpe] = useState(7);
  const [energy, setEnergy] = useState<"low" | "mid" | "high">("mid");
  const [note, setNote] = useState("");

  const current = flat[idx];
  const ex = current ? getExercise(current.exerciseId) : null;
  const pct = ((idx + (done ? 1 : 0)) / flat.length) * 100;

  function next() {
    if (idx + 1 >= flat.length) {
      setDone(true);
    } else setIdx(idx + 1);
  }

  function finish() {
    const day = weeklyPlan.find((p) => p.workoutId === id)?.day;
    if (day) markCompleted(day, id);
    addLog({ workoutId: id, date: new Date().toISOString(), rpe, energy, note });
    navigate({ to: "/progress" });
  }

  if (done) {
    return (
      <AppShell>
        <div
          className="space-y-6 rounded-3xl border border-border bg-card p-6 text-center"
          style={{ backgroundImage: "var(--gradient-hero)" }}
        >
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-primary/30 bg-primary/10 text-primary">
            <Award className="h-10 w-10" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-3xl font-bold">Training abgeschlossen</h1>
          <p className="text-muted-foreground">Stark. Trag deinen Eindruck ein.</p>
        </div>

        <div className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-5">
          <div>
            <label className="text-sm font-semibold">Wie schwer? {rpe}/10</label>
            <input
              type="range"
              min={1}
              max={10}
              value={rpe}
              onChange={(e) => setRpe(+e.target.value)}
              className="mt-2 w-full accent-[color:var(--primary)]"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Energie</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["low", "mid", "high"] as const).map((e) => (
                <button
                  key={e}
                  onClick={() => setEnergy(e)}
                  className={`rounded-full py-2 text-sm font-semibold ${energy === e ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}
                >
                  {e === "low" ? "Niedrig" : e === "mid" ? "Mittel" : "Hoch"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold">Notizen</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Gewicht, Gefühl, was lief gut..."
              className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-sm"
            />
          </div>
          <button
            onClick={finish}
            className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground"
          >
            Speichern
          </button>
        </div>
      </AppShell>
    );
  }

  if (!ex || !current)
    return (
      <AppShell>
        <p>Keine Übung.</p>
      </AppShell>
    );

  return (
    <AppShell>
      <Link
        to="/training/$id"
        params={{ id: w.id }}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Übersicht
      </Link>

      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {current.block} · {idx + 1}/{flat.length}
      </p>

      <div className="mt-4 rounded-3xl border border-border bg-card p-6">
        <div className="grid place-items-center rounded-2xl bg-background py-6">
          <ExerciseAnimation type={ex.animation} size={200} color="var(--primary)" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold">{ex.name}</h1>
        <p className="text-sm text-muted-foreground">{current.label}</p>

        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          {ex.execution.slice(0, 3).map((s, i) => (
            <li key={i}>• {s}</li>
          ))}
        </ul>

        {current.rest && (
          <div className="mt-4">
            <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
              Pause {current.rest}
            </p>
            {/* key={idx}: Timer startet bei jeder Übung frisch, statt Restzeit mitzunehmen */}
            <RestTimer key={idx} seconds={parseInt(current.rest) || 90} />
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={next}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-primary-foreground"
          >
            <Check className="h-4 w-4" /> Erledigt
          </button>
          <button
            onClick={next}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border py-3 font-semibold text-muted-foreground"
          >
            <SkipForward className="h-4 w-4" /> Überspringen
          </button>
        </div>

        {ex.alternatives.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-primary">
              Alternative anzeigen
            </summary>
            <div className="mt-2 flex flex-wrap gap-2">
              {ex.alternatives.map((a) => {
                const alt = findExerciseByName(a);
                return alt ? (
                  <Link
                    key={a}
                    to="/exercises/$id"
                    params={{ id: alt.id }}
                    className="rounded-full bg-secondary px-3 py-1 text-xs text-primary"
                  >
                    {a} →
                  </Link>
                ) : (
                  <span
                    key={a}
                    className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground"
                  >
                    {a}
                  </span>
                );
              })}
            </div>
          </details>
        )}
      </div>

      <button
        onClick={() => setIdx(0)}
        className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground"
      >
        <RotateCcw className="h-3 w-3" /> Von vorn
      </button>
    </AppShell>
  );
}
