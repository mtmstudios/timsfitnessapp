import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { AppShell } from "@/components/AppShell";
import { loadState } from "@/lib/storage";
import { weeklyPlan, getWorkout } from "@/data/workouts";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Fortschritt — Atlas" }] }),
  component: Progress,
});

const mockData = [
  { week: "KW 1", sessions: 3, runs: 1 },
  { week: "KW 2", sessions: 4, runs: 2 },
  { week: "KW 3", sessions: 5, runs: 2 },
  { week: "KW 4", sessions: 4, runs: 2 },
  { week: "KW 5", sessions: 5, runs: 2 },
  { week: "KW 6", sessions: 6, runs: 2 },
];

function Progress() {
  const [state, setState] = useState(() => loadState());
  useEffect(() => { setState(loadState()); }, []);

  const doneDays = Object.keys(state.completed).map((k) => k.split("-").pop()!);
  const sessionsThisWeek = doneDays.length;
  const runsThisWeek = weeklyPlan.filter((p) => doneDays.includes(p.day) && getWorkout(p.workoutId).category === "cardio").length;
  const strengthThisWeek = weeklyPlan.filter((p) => doneDays.includes(p.day) && getWorkout(p.workoutId).category === "strength").length;

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Fortschritt</h1>
        <p className="mt-1 text-sm text-muted-foreground">Konstanz schlägt Intensität.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Diese Woche" value={`${sessionsThisWeek}`} sub="Trainings" />
        <Stat label="Kraft" value={`${strengthThisWeek}`} sub="Einheiten" />
        <Stat label="Lauf" value={`${runsThisWeek}`} sub="Einheiten" />
        <Stat label="Streak" value={`${state.logs.length}`} sub="Sessions gesamt" />
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-4">
        <h2 className="font-display text-lg font-bold">Trainings pro Woche</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockData}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Line type="monotone" dataKey="sessions" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="runs" stroke="var(--cat-run)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Beispiel-Trend. Mit jedem abgeschlossenen Training wachsen deine Daten.</p>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-4">
        <h2 className="font-display text-lg font-bold">Letzte Sessions</h2>
        {state.logs.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Noch keine Sessions geloggt. Starte dein erstes Training.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {state.logs.slice(-5).reverse().map((l, i) => (
              <li key={i} className="rounded-xl border border-border p-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold">{getWorkout(l.workoutId)?.title ?? l.workoutId}</span>
                  <span className="text-muted-foreground">{new Date(l.date).toLocaleDateString("de-DE")}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">RPE {l.rpe} · Energie {l.energy}</div>
                {l.note && <p className="mt-1 text-xs">{l.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-4">
        <h2 className="font-display text-lg font-bold">Erinnerung</h2>
        <p className="mt-1 text-sm text-muted-foreground">Nicht jedes Training muss dich zerstören. Die meisten Einheiten bei 6–8/10. Konstanz baut den Körper, den du willst.</p>
      </section>
    </AppShell>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-3xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}