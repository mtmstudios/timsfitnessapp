import type { ExerciseCategory } from "./exercises";

export interface WorkoutSet {
  exerciseId: string;
  sets?: number;
  reps?: string;
  duration?: string;
  rest?: string;
  note?: string;
}

export interface WorkoutBlock {
  title: string;
  description?: string;
  rounds?: number;
  items: WorkoutSet[];
}

export interface Workout {
  id: string;
  title: string;
  subtitle: string;
  category: ExerciseCategory;
  duration: string;
  intensity: string;
  goal: string;
  blocks: WorkoutBlock[];
}

export const workouts: Record<string, Workout> = {
  "ganzkoerper-a": {
    id: "ganzkoerper-a",
    title: "Ganzkörper A",
    subtitle: "Krafttraining",
    category: "strength",
    duration: "60–75 min",
    intensity: "7/10",
    goal: "Kraft, Muskelerhalt, Grundübungen",
    blocks: [
      {
        title: "Warm-up",
        description: "5 min lockeres Cardio, dann 2 Runden",
        rounds: 2,
        items: [
          { exerciseId: "air-squat", reps: "10" },
          { exerciseId: "arm-circle", reps: "10 je Richtung" },
          { exerciseId: "hip-circle", reps: "10 je Richtung" },
          { exerciseId: "lunges", reps: "10" },
          { exerciseId: "scapula-pushup", reps: "10" },
          { exerciseId: "plank", duration: "20s" },
        ],
      },
      {
        title: "Haupttraining",
        items: [
          { exerciseId: "leg-press", sets: 3, reps: "6–10", rest: "90–120s" },
          { exerciseId: "bench-press", sets: 3, reps: "6–10", rest: "90–120s" },
          { exerciseId: "row-machine", sets: 3, reps: "8–12", rest: "90s" },
          { exerciseId: "rdl", sets: 3, reps: "8–10", rest: "90–120s" },
          { exerciseId: "shoulder-press", sets: 3, reps: "8–10", rest: "90s" },
          { exerciseId: "plank", sets: 3, duration: "30–60s", rest: "60s" },
        ],
      },
      {
        title: "Cooldown",
        description: "5 min locker + Stretching",
        items: [
          { exerciseId: "hip-flexor", duration: "45s je Seite" },
          { exerciseId: "chest-stretch", duration: "45s je Seite" },
          { exerciseId: "hamstring", duration: "45s je Seite" },
        ],
      },
    ],
  },
  "lockerer-lauf": {
    id: "lockerer-lauf",
    title: "Lockerer Lauf",
    subtitle: "Ausdauer",
    category: "cardio",
    duration: "30–40 min",
    intensity: "5–6/10",
    goal: "Ausdauerbasis, Fettstoffwechsel",
    blocks: [
      {
        title: "Ablauf",
        items: [
          { exerciseId: "walk", duration: "5 min" },
          { exerciseId: "easy-run", duration: "20–30 min" },
          { exerciseId: "walk", duration: "5 min" },
        ],
      },
    ],
  },
  "dynamisch": {
    id: "dynamisch",
    title: "Dynamisches Workout",
    subtitle: "Athletik & Puls",
    category: "dynamic",
    duration: "40–50 min",
    intensity: "7–8/10",
    goal: "Athletik, Puls, Core, Beweglichkeit",
    blocks: [
      {
        title: "Warm-up",
        rounds: 2,
        items: [
          { exerciseId: "walk", duration: "30s Cardio" },
          { exerciseId: "air-squat", reps: "10" },
          { exerciseId: "lunges", reps: "10" },
          { exerciseId: "arm-circle", reps: "10 je Richtung" },
          { exerciseId: "scapula-pushup", reps: "10" },
          { exerciseId: "hip-hinge", reps: "10" },
          { exerciseId: "plank", duration: "20s" },
        ],
      },
      {
        title: "Block 1 — Dynamik",
        description: "3–4 Runden, Pause 45–60s",
        rounds: 3,
        items: [
          { exerciseId: "squat-jump", reps: "8–10" },
          { exerciseId: "db-rdl-explosive", reps: "10–12" },
          { exerciseId: "step-up", reps: "8 je Bein" },
        ],
      },
      {
        title: "Block 2 — Kraft-Ausdauer-Zirkel",
        description: "4 Runden, Pause 60–90s",
        rounds: 4,
        items: [
          { exerciseId: "goblet-squat", reps: "10–12" },
          { exerciseId: "pushup", reps: "8–12" },
          { exerciseId: "cable-row", reps: "10–12" },
          { exerciseId: "db-rdl-explosive", reps: "10–12" },
          { exerciseId: "shoulder-tap", duration: "30s" },
        ],
      },
      {
        title: "Block 3 — Core & Mobility",
        rounds: 2,
        items: [
          { exerciseId: "dead-bug", reps: "10 je Seite" },
          { exerciseId: "side-plank", duration: "20–40s je Seite" },
          { exerciseId: "pallof-press", reps: "10–12 je Seite" },
          { exerciseId: "hip-flexor", duration: "45s je Seite" },
          { exerciseId: "lat-stretch", duration: "45s je Seite" },
        ],
      },
    ],
  },
  "regeneration": {
    id: "regeneration",
    title: "Regeneration & Mobility",
    subtitle: "Erholung",
    category: "mobility",
    duration: "15–60 min",
    intensity: "2–3/10",
    goal: "Erholung, Mobility, Schritte",
    blocks: [
      {
        title: "Mini-Mobility",
        rounds: 2,
        items: [
          { exerciseId: "hip-flexor", duration: "60s je Seite" },
          { exerciseId: "hamstring", duration: "60s je Seite" },
          { exerciseId: "chest-stretch", duration: "60s" },
          { exerciseId: "deep-squat", reps: "10" },
          { exerciseId: "cat-cow", reps: "10" },
          { exerciseId: "thoracic", reps: "10 je Seite" },
        ],
      },
    ],
  },
  "ganzkoerper-b": {
    id: "ganzkoerper-b",
    title: "Ganzkörper B",
    subtitle: "Krafttraining",
    category: "strength",
    duration: "60–75 min",
    intensity: "7/10",
    goal: "Rücken, Beine, Push/Pull, Stabilität",
    blocks: [
      {
        title: "Warm-up",
        rounds: 2,
        items: [
          { exerciseId: "air-squat", reps: "10" },
          { exerciseId: "hip-hinge", reps: "10" },
          { exerciseId: "lunges", reps: "10" },
          { exerciseId: "band-pullapart", reps: "10" },
          { exerciseId: "plank", duration: "20s" },
        ],
      },
      {
        title: "Haupttraining",
        items: [
          { exerciseId: "hip-thrust", sets: 3, reps: "6–10", rest: "90–120s" },
          { exerciseId: "lat-pulldown", sets: 3, reps: "8–12", rest: "90s" },
          { exerciseId: "incline-press", sets: 3, reps: "8–12", rest: "90s" },
          { exerciseId: "bulgarian-split", sets: 3, reps: "8–10 je Bein", rest: "90s" },
          { exerciseId: "face-pulls", sets: 3, reps: "12–15", rest: "60–90s" },
          { exerciseId: "farmer-walk", sets: 3, duration: "30–60m", rest: "60s" },
          { exerciseId: "pallof-press", sets: 3, reps: "10 je Seite", rest: "45s" },
        ],
      },
      {
        title: "Cooldown",
        items: [
          { exerciseId: "couch-stretch", duration: "60s je Seite" },
          { exerciseId: "lat-stretch", duration: "60s je Seite" },
        ],
      },
    ],
  },
  "lauf-2": {
    id: "lauf-2",
    title: "Lauf 2 — Wechseltraining",
    subtitle: "Intervall oder langer Lauf",
    category: "cardio",
    duration: "30–60 min",
    intensity: "variabel",
    goal: "Tempo oder Zeit auf den Beinen",
    blocks: [
      {
        title: "Woche A — Intervalle",
        items: [
          { exerciseId: "easy-run", duration: "5–10 min einlaufen" },
          { exerciseId: "interval-run", sets: 6, reps: "1 min schnell / 2 min locker" },
          { exerciseId: "easy-run", duration: "5–10 min auslaufen" },
        ],
      },
      {
        title: "Woche B — Lang locker",
        items: [{ exerciseId: "long-run", duration: "40–60 min" }],
      },
    ],
  },
  "sonntag-mobility": {
    id: "sonntag-mobility",
    title: "Pause / Mobility",
    subtitle: "Sonntag",
    category: "mobility",
    duration: "15–60 min",
    intensity: "2/10",
    goal: "Regeneration",
    blocks: [
      {
        title: "Mobility-Flow",
        items: [
          { exerciseId: "hip-flexor", duration: "1 min je Seite" },
          { exerciseId: "couch-stretch", duration: "1 min je Seite" },
          { exerciseId: "hamstring", duration: "1 min je Seite" },
          { exerciseId: "deep-squat", duration: "1–2 min" },
          { exerciseId: "lat-stretch", duration: "1 min je Seite" },
          { exerciseId: "cat-cow", reps: "10" },
          { exerciseId: "thoracic", reps: "10 je Seite" },
        ],
      },
    ],
  },
};

export const weekdays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;
export const weekdaysLong = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"] as const;

export const weeklyPlan: { day: string; workoutId: keyof typeof workouts; optional?: boolean }[] = [
  { day: "Mo", workoutId: "ganzkoerper-a" },
  { day: "Di", workoutId: "lockerer-lauf" },
  { day: "Mi", workoutId: "dynamisch" },
  { day: "Do", workoutId: "regeneration", optional: true },
  { day: "Fr", workoutId: "ganzkoerper-b" },
  { day: "Sa", workoutId: "lauf-2" },
  { day: "So", workoutId: "sonntag-mobility", optional: true },
];

export function getWorkout(id: string) {
  return workouts[id];
}

export const motivationalQuotes = [
  "Stark. Training erledigt.",
  "Nicht jedes Training muss dich zerstören.",
  "Saubere Wiederholungen vor Ego-Gewicht.",
  "Athletisch werden heißt: Kraft, Ausdauer und Beweglichkeit kombinieren.",
  "Wenn du heute müde bist: leichter trainieren ist besser als ausfallen.",
  "Heute locker bleiben. Ausdauer entsteht durch Konstanz.",
  "Konstanz schlägt Intensität.",
];