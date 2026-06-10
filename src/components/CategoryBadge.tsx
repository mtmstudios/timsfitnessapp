import type { ExerciseCategory } from "@/data/exercises";
import { categoryLabels } from "@/data/exercises";

const colors: Record<ExerciseCategory, string> = {
  strength:
    "bg-[color:var(--cat-strength)]/15 text-[color:var(--cat-strength)] ring-1 ring-[color:var(--cat-strength)]/30",
  cardio:
    "bg-[color:var(--cat-run)]/15 text-[color:var(--cat-run)] ring-1 ring-[color:var(--cat-run)]/30",
  dynamic:
    "bg-[color:var(--cat-dynamic)]/15 text-[color:var(--cat-dynamic)] ring-1 ring-[color:var(--cat-dynamic)]/30",
  mobility:
    "bg-[color:var(--cat-mobility)]/15 text-[color:var(--cat-mobility)] ring-1 ring-[color:var(--cat-mobility)]/30",
  core: "bg-[color:var(--cat-mobility)]/15 text-[color:var(--cat-mobility)] ring-1 ring-[color:var(--cat-mobility)]/30",
};

export function CategoryBadge({ category, label }: { category: ExerciseCategory; label?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[category]}`}
    >
      {label ?? categoryLabels[category]}
    </span>
  );
}
