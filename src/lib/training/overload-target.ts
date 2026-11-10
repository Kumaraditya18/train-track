import { previousIsoWeekKey } from "@/lib/dates/iso-week";
import { bestForWeek } from "@/lib/training/weekly-max";
import type { OverloadHint, WeeklyBest } from "@/lib/training/types";

export function buildOverloadHints(input: {
  weekKey: string;
  repFloorsByExercise: Map<string, { name: string; repFloor: number }>;
  weeklyBests: WeeklyBest[];
}): OverloadHint[] {
  const prevKey = previousIsoWeekKey(input.weekKey);
  const hints: OverloadHint[] = [];

  for (const [exerciseId, meta] of input.repFloorsByExercise) {
    const thisWeek = bestForWeek(input.weeklyBests, exerciseId, input.weekKey);
    const lastWeek = bestForWeek(input.weeklyBests, exerciseId, prevKey);
    hints.push({
      exerciseId,
      exerciseName: meta.name,
      lastWeek,
      thisWeek,
      repFloor: meta.repFloor,
      suggestion: suggestNext(lastWeek, thisWeek, meta.repFloor),
    });
  }

  return hints.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
}

function suggestNext(
  lastWeek: WeeklyBest | null,
  thisWeek: WeeklyBest | null,
  repFloor: number,
): string {
  if (!lastWeek && !thisWeek) {
    return "Log your first working sets this week.";
  }
  if (!thisWeek) {
    return lastWeek
      ? `Aim to match or beat ${lastWeek.topWeightKg} kg × ${lastWeek.repsAtTopWeight} reps.`
      : "Start with a weight you can control for your target reps.";
  }
  if (!lastWeek) {
    return thisWeek.repsAtTopWeight >= repFloor
      ? `Strong start. Next session try ${thisWeek.topWeightKg + 2.5} kg or add 1–2 reps at ${thisWeek.topWeightKg} kg.`
      : `Build to ${repFloor}+ reps at ${thisWeek.topWeightKg} kg before adding weight.`;
  }

  const beatWeight = thisWeek.topWeightKg > lastWeek.topWeightKg;
  const sameWeightMoreReps =
    thisWeek.topWeightKg === lastWeek.topWeightKg &&
    thisWeek.repsAtTopWeight > lastWeek.repsAtTopWeight;

  if (beatWeight || sameWeightMoreReps) {
    return "Progress logged — keep the same plan or add a small jump next week.";
  }

  if (thisWeek.repsAtTopWeight >= repFloor) {
    return `Try ${lastWeek.topWeightKg + 2.5} kg for ${Math.max(repFloor - 1, 6)}–${repFloor} reps.`;
  }

  return `Stay at ${thisWeek.topWeightKg} kg until you hit ${repFloor} reps, then add 2.5 kg.`;
}
