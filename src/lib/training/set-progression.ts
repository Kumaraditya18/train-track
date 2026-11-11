import type { SetLog } from "@/lib/training/types";

export const WEIGHT_STEP_KG = 2.5;

export type RepBand = {
  repMin: number;
  repMax: number;
};

export const DEFAULT_REP_BAND: RepBand = { repMin: 8, repMax: 12 };

type NamedLog = SetLog & { exercise_name?: string };

export type LastExerciseSet = {
  weightKg: number;
  reps: number;
  loggedAt: string;
};

export type ExerciseProgression = {
  bestLine: string;
  suggestion: string;
};

export function lastLoggedSet(logs: NamedLog[], exerciseId: string): LastExerciseSet | null {
  let latest: NamedLog | null = null;
  for (const row of logs) {
    if (row.exercise_id !== exerciseId) continue;
    if (!latest || row.logged_at > latest.logged_at) latest = row;
  }
  if (!latest) return null;
  return {
    weightKg: Number(latest.weight_kg),
    reps: latest.reps,
    loggedAt: latest.logged_at,
  };
}

/**
 * Heaviest set that hit at least repMin (includes above repMax — e.g. 30×13 counts).
 * Tie on weight: more reps, then newer.
 */
export function bestWorkingSet(
  logs: NamedLog[],
  exerciseId: string,
  band: RepBand,
): LastExerciseSet | null {
  const { repMin } = band;
  let best: NamedLog | null = null;
  for (const row of logs) {
    if (row.exercise_id !== exerciseId) continue;
    if (row.reps < repMin) continue;
    const w = Number(row.weight_kg);
    if (!best) {
      best = row;
      continue;
    }
    const bw = Number(best.weight_kg);
    if (w > bw) {
      best = row;
      continue;
    }
    if (w < bw) continue;
    if (row.reps > best.reps) {
      best = row;
      continue;
    }
    if (row.reps === best.reps && row.logged_at > best.logged_at) {
      best = row;
    }
  }
  if (!best) return null;
  return {
    weightKg: Number(best.weight_kg),
    reps: best.reps,
    loggedAt: best.logged_at,
  };
}

export function lastQualifyingSet(
  logs: NamedLog[],
  exerciseId: string,
  minReps: number,
): LastExerciseSet | null {
  let latest: NamedLog | null = null;
  for (const row of logs) {
    if (row.exercise_id !== exerciseId) continue;
    if (row.reps < minReps) continue;
    if (!latest || row.logged_at > latest.logged_at) latest = row;
  }
  if (!latest) return null;
  return {
    weightKg: Number(latest.weight_kg),
    reps: latest.reps,
    loggedAt: latest.logged_at,
  };
}

function progressionSuggestion(reps: number, band: RepBand): string {
  const { repMin, repMax } = band;
  if (reps > repMax) {
    return "Increase weight on your next working set.";
  }
  if (reps >= repMin && reps <= repMax) {
    return `Stay at this weight — aim for ${repMax} reps before going heavier.`;
  }
  return `Decrease weight — hit at least ${repMin} reps per set.`;
}

export function progressionForExercise(
  logs: NamedLog[],
  exerciseId: string,
  band: RepBand = DEFAULT_REP_BAND,
): ExerciseProgression | null {
  const best = bestWorkingSet(logs, exerciseId, band);
  const reference = best ?? lastLoggedSet(logs, exerciseId);
  if (!reference) return null;

  const bestLine = best
    ? `Your best is ${reference.weightKg} kg × ${reference.reps} reps.`
    : `Your last set: ${reference.weightKg} kg × ${reference.reps} reps.`;

  return {
    bestLine,
    suggestion: progressionSuggestion(reference.reps, band),
  };
}

export function suggestionFromBest(
  weightKg: number,
  reps: number,
  band: RepBand,
): string {
  if (reps > band.repMax) {
    return `Above ${band.repMax} reps — try ${weightKg + WEIGHT_STEP_KG} kg next time.`;
  }
  if (reps >= band.repMin && reps <= band.repMax) {
    return `Keep ${weightKg} kg — build toward ${band.repMax} reps before adding weight.`;
  }
  return `Under ${band.repMin} reps — drop weight and hit at least ${band.repMin}.`;
}
