import type { WorkoutExercise } from "@/components/workout/WorkoutSessionView";
import type { Exercise, RoutineItem } from "@/lib/training/types";

type ItemRow = RoutineItem & { exercises: Exercise | Exercise[] | null };

type SessionRow = {
  target_sets: number;
  rep_floor: number;
  rep_ceiling?: number;
  sort_order: number;
  exercises: Exercise | Exercise[] | null;
};

function mapExercise(
  ex: Exercise,
  target_sets: number,
  rep_floor: number,
  rep_ceiling: number,
  isPlanned: boolean,
): WorkoutExercise {
  return {
    id: ex.id,
    name: ex.name,
    muscle_group: ex.muscle_group,
    instructions: null,
    video_url: null,
    video_source: null,
    video_attribution: null,
    focus_muscles: null,
    target_sets,
    rep_floor,
    rep_ceiling,
    isPlanned,
  };
}

function flattenJoin<T extends { exercises: Exercise | Exercise[] | null }>(
  row: T,
  mapper: (ex: Exercise, row: T) => WorkoutExercise,
): WorkoutExercise[] {
  const ex = Array.isArray(row.exercises) ? row.exercises[0] : row.exercises;
  if (!ex) return [];
  return [mapper(ex, row)];
}

export function mergeSessionExercises(
  routineItems: ItemRow[] | null,
  sessionExtras: SessionRow[] | null,
  isRoutineSession: boolean,
): WorkoutExercise[] {
  const planned =
    (routineItems ?? []).flatMap((item) =>
      flattenJoin(item, (ex, row) =>
        mapExercise(ex, row.target_sets, row.rep_floor, row.rep_ceiling ?? 12, true),
      ),
    ) ?? [];

  if (!isRoutineSession) {
    return (sessionExtras ?? []).flatMap((item) =>
      flattenJoin(item, (ex, row) =>
        mapExercise(ex, row.target_sets, row.rep_floor, row.rep_ceiling ?? 12, true),
      ),
    );
  }

  const plannedIds = new Set(planned.map((p) => p.id));
  const extras = (sessionExtras ?? []).flatMap((item) => {
    const ex = Array.isArray(item.exercises) ? item.exercises[0] : item.exercises;
    if (!ex || plannedIds.has(ex.id)) return [];
    return [mapExercise(ex, item.target_sets, item.rep_floor, item.rep_ceiling ?? 12, false)];
  });

  return [...planned, ...extras];
}
