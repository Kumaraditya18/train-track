import { previousIsoWeekKey } from "@/lib/dates/iso-week";
import { suggestionFromBest, type RepBand } from "@/lib/training/set-progression";
import { bestForWeek } from "@/lib/training/weekly-max";
import type { OverloadHint, WeeklyBest } from "@/lib/training/types";

export type RepBandByExercise = Map<string, RepBand & { name: string }>;

export function buildOverloadHints(input: {
  weekKey: string;
  repBandsByExercise: RepBandByExercise;
  weeklyBests: WeeklyBest[];
}): OverloadHint[] {
  const prevKey = previousIsoWeekKey(input.weekKey);
  const hints: OverloadHint[] = [];

  for (const [exerciseId, meta] of input.repBandsByExercise) {
    const band: RepBand = { repMin: meta.repMin, repMax: meta.repMax };
    const thisWeek = bestForWeek(input.weeklyBests, exerciseId, input.weekKey);
    const lastWeek = bestForWeek(input.weeklyBests, exerciseId, prevKey);
    hints.push({
      exerciseId,
      exerciseName: meta.name,
      lastWeek,
      thisWeek,
      repFloor: meta.repMin,
      repCeiling: meta.repMax,
      suggestion: suggestNext(lastWeek, thisWeek, band),
    });
  }

  return hints.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
}

function suggestNext(lastWeek: WeeklyBest | null, thisWeek: WeeklyBest | null, band: RepBand): string {
  if (!lastWeek && !thisWeek) {
    return `Log working sets (aim ${band.repMin}–${band.repMax} reps per set).`;
  }
  if (!thisWeek) {
    return lastWeek
      ? `Last week ${lastWeek.topWeightKg} kg × ${lastWeek.repsAtTopWeight}. Match or beat it — aim ${band.repMin}–${band.repMax} reps.`
      : `Start with a weight you can control for ${band.repMin}–${band.repMax} reps.`;
  }
  if (!lastWeek) {
    return suggestionFromBest(thisWeek.topWeightKg, thisWeek.repsAtTopWeight, band);
  }

  const beatWeight = thisWeek.topWeightKg > lastWeek.topWeightKg;
  const sameWeightMoreReps =
    thisWeek.topWeightKg === lastWeek.topWeightKg &&
    thisWeek.repsAtTopWeight > lastWeek.repsAtTopWeight;

  if (beatWeight || sameWeightMoreReps) {
    return `This week ${thisWeek.topWeightKg} kg × ${thisWeek.repsAtTopWeight}. ${suggestionFromBest(thisWeek.topWeightKg, thisWeek.repsAtTopWeight, band)}`;
  }

  return suggestionFromBest(thisWeek.topWeightKg, thisWeek.repsAtTopWeight, band);
}
