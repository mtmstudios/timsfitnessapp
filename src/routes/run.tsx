import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { IntervalTimer } from "@/components/Timer";

export const Route = createFileRoute("/run")({
  head: () => ({ meta: [{ title: "Lauf-Timer — Atlas" }] }),
  component: Run,
});

type Mode = "easy" | "intervals" | "long";

function Run() {
  const [mode, setMode] = useState<Mode>("easy");

  const phases =
    mode === "easy"
      ? [
          { label: "Aufwärmen gehen", seconds: 5 * 60 },
          { label: "Locker laufen", seconds: 25 * 60 },
          { label: "Auslaufen", seconds: 5 * 60 },
        ]
      : mode === "intervals"
      ? [
          { label: "Einlaufen", seconds: 10 * 60 },
          ...Array.from({ length: 6 }, (_, i) => [
            { label: `Schnell ${i + 1}/6`, seconds: 60 },
            { label: `Locker traben`, seconds: 120 },
          ]).flat(),
          { label: "Auslaufen", seconds: 10 * 60 },
        ]
      : [
          { label: "Einlaufen", seconds: 5 * 60 },
          { label: "Lang locker", seconds: 45 * 60 },
          { label: "Auslaufen", seconds: 5 * 60 },
        ];

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Lauf-Timer</h1>
        <p className="mt-1 text-sm text-muted-foreground">Wähle deinen Modus.</p>
      </header>

      <div className="mb-5 grid grid-cols-3 gap-2">
        {([["easy", "Locker"], ["intervals", "Intervalle"], ["long", "Lang"]] as const).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setMode(k)}
            className={`rounded-full py-2 text-sm font-semibold ${mode === k ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}
          >
            {l}
          </button>
        ))}
      </div>

      <IntervalTimer key={mode} phases={phases} />

      <div className="mt-6 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        {mode === "easy" && "Sprechtempo. Atmung leicht. Nicht auf Pace geiern."}
        {mode === "intervals" && "Schnell heißt zügig, nicht Sprint. Sauberes Tempo halten."}
        {mode === "long" && "Zeit auf den Beinen. Tempo so wählen, dass kurze Sätze noch möglich sind."}
      </div>
    </AppShell>
  );
}