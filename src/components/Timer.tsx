import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

export function RestTimer({ seconds = 90 }: { seconds?: number }) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (ref.current) clearInterval(ref.current);
    },
    [],
  );

  useEffect(() => {
    if (running && left > 0) {
      ref.current = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    }
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [running, left]);

  useEffect(() => {
    if (left === 0) setRunning(false);
  }, [left]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <div className="font-display text-2xl font-bold tabular-nums">
        {mm}:{ss}
      </div>
      <button
        onClick={() => setRunning((r) => !r)}
        className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground"
        aria-label={running ? "Pause" : "Start"}
      >
        {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <button
        onClick={() => {
          setRunning(false);
          setLeft(seconds);
        }}
        className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground"
        aria-label="Reset"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Interval timer with phases (e.g. run/walk). */
export function IntervalTimer({ phases }: { phases: { label: string; seconds: number }[] }) {
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState(phases[0]?.seconds ?? 0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (ref.current) clearInterval(ref.current);
    },
    [],
  );

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => {
      setLeft((l) => {
        if (l > 1) return l - 1;
        setIdx((i) => {
          if (i + 1 >= phases.length) {
            // letzte Phase vorbei: stoppen statt von vorn zu loopen
            setRunning(false);
            setFinished(true);
            return i;
          }
          setLeft(phases[i + 1].seconds);
          return i + 1;
        });
        return 0;
      });
    }, 1000);
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [running, phases]);

  const phase = phases[idx];
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const pct = phase ? (1 - left / phase.seconds) * 100 : 0;

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div className="text-center">
        <div className="text-sm uppercase tracking-widest text-muted-foreground">
          {finished ? "Fertig — stark! 💪" : phase?.label}
        </div>
        <div className="font-display text-6xl font-bold tabular-nums mt-2">
          {mm}:{ss}
        </div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-center gap-3">
        <button
          onClick={() => setRunning((r) => !r)}
          className="rounded-full bg-primary px-6 py-2 font-semibold text-primary-foreground"
        >
          {running ? "Pause" : "Start"}
        </button>
        <button
          onClick={() => {
            setRunning(false);
            setFinished(false);
            setIdx(0);
            setLeft(phases[0]?.seconds ?? 0);
          }}
          className="rounded-full border border-border px-6 py-2 font-semibold"
        >
          Reset
        </button>
      </div>
      <div className="text-center text-xs text-muted-foreground">
        Phase {idx + 1} / {phases.length}
      </div>
    </div>
  );
}
