import { isoWeekKeyFromIso } from "@/lib/dates/iso-week";
import type { SetLog, WeeklyBest } from "@/lib/training/types";

type NamedLog = SetLog & { exercise_name: string };

export function weeklyBestsFromLogs(logs: NamedLog[]): WeeklyBest[] {
  const byExerciseWeek = new Map<string, WeeklyBest>();

  for (const row of logs) {
    const weekKey = isoWeekKeyFromIso(row.logged_at);
    const mapKey = `${row.exercise_id}:${weekKey}`;
    const weight = Number(row.weight_kg);
    const existing = byExerciseWeek.get(mapKey);

    if (!existing || weight > existing.topWeightKg) {
      byExerciseWeek.set(mapKey, {
        exerciseId: row.exercise_id,
        exerciseName: row.exercise_name,
        weekKey,
        topWeightKg: weight,
        repsAtTopWeight: row.reps,
      });
      continue;
    }

    if (weight === existing.topWeightKg && row.reps > existing.repsAtTopWeight) {
      existing.repsAtTopWeight = row.reps;
    }
  }

  return [...byExerciseWeek.values()].sort((a, b) =>
    a.exerciseName.localeCompare(b.exerciseName),
  );
}

export function bestForWeek(
  bests: WeeklyBest[],
  exerciseId: string,
  weekKey: string,
): WeeklyBest | null {
  return bests.find((b) => b.exerciseId === exerciseId && b.weekKey === weekKey) ?? null;
}
