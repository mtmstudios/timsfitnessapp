import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flame, ChevronRight, CheckCircle2, Calendar as CalendarIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CategoryBadge } from "@/components/CategoryBadge";
import { weeklyPlan, weekdaysLong, getWorkout, motivationalQuotes } from "@/data/workouts";
import { loadState, getTodayWeekdayIndex } from "@/lib/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atlas — Dein Trainingsplan" },
      { name: "description", content: "Persönlicher Trainingsplan: Kraft, Lauf, Athletik & Mobility." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [today, setToday] = useState(0);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [quote, setQuote] = useState("");

  useEffect(() => {
    setToday(getTodayWeekdayIndex());
    const s = loadState();
    const week = Object.keys(s.completed).map((k) => k.split("-").pop()!);
    setDone(new Set(week));
    setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  }, []);

  const todayEntry = weeklyPlan[today];
  const todayWorkout = getWorkout(todayEntry.workoutId);
  const tomorrowEntry = weeklyPlan[(today + 1) % 7];
  const tomorrowWorkout = getWorkout(tomorrowEntry.workoutId);
  const completedCount = weeklyPlan.filter((d) => done.has(d.day)).length;

  return (
    <AppShell>
      <div className="space-y-8">
        <header>
          <p className="text-sm text-muted-foreground">{weekdaysLong[today]}</p>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Bereit für heute?</h1>
          <p className="mt-2 text-sm text-muted-foreground italic">„{quote}"</p>
        </header>

        {/* Hero — today */}
        <Link
          to="/training/$id"
          params={{ id: todayWorkout.id }}
          className="group block overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-glow)] transition hover:scale-[1.01]"
          style={{ backgroundImage: "var(--gradient-hero)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <CategoryBadge category={todayWorkout.category} />
              <h2 className="mt-3 font-display text-2xl font-bold md:text-3xl">{todayWorkout.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{todayWorkout.goal}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>⏱ {todayWorkout.duration}</span>
                <span>🔥 {todayWorkout.intensity}</span>
              </div>
            </div>
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition group-hover:scale-110">
              <Flame className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            Training starten <ChevronRight className="h-4 w-4" />
          </div>
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Diese Woche" value={`${completedCount}/7`} />
          <Stat label="Heute" value={done.has(weeklyPlan[today].day) ? "✓" : "Offen"} />
          <Stat label="Morgen" value={tomorrowWorkout.subtitle} />
        </div>

        {/* Week strip */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Diese Woche</h3>
            <Link to="/plan" className="text-sm text-primary">Alle Tage</Link>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weeklyPlan.map((d, i) => {
              const w = getWorkout(d.workoutId);
              const isDone = done.has(d.day);
              const isToday = i === today;
              return (
                <Link
                  key={d.day}
                  to="/training/$id"
                  params={{ id: w.id }}
                  className={`flex flex-col items-center gap-1 rounded-2xl border p-2 text-center transition ${
                    isToday
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-muted-foreground/40"
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{d.day}</span>
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: `var(--cat-${w.category === "core" ? "mobility" : w.category === "cardio" ? "run" : w.category})` }}
                  />
                  {isDone ? (
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                  ) : (
                    <span className="h-3 w-3" />
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        {/* Up next */}
        <section>
          <h3 className="mb-3 font-display text-lg font-semibold">Als nächstes</h3>
          <Link
            to="/training/$id"
            params={{ id: tomorrowWorkout.id }}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40"
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <CategoryBadge category={tomorrowWorkout.category} />
                <span className="text-xs text-muted-foreground">Morgen</span>
              </div>
              <p className="mt-1 truncate font-semibold">{tomorrowWorkout.title}</p>
              <p className="text-xs text-muted-foreground">{tomorrowWorkout.duration} · {tomorrowWorkout.goal}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        </section>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 truncate font-display text-lg font-bold">{value}</div>
    </div>
  );
}
