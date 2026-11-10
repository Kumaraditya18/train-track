import type { WorkoutExercise } from "@/components/workout/WorkoutSessionView";
import { resolveExerciseMedia } from "@/lib/exercise/resolve-gif";
import type { Exercise, RoutineItem } from "@/lib/training/types";

type ItemRow = RoutineItem & { exercises: Exercise | Exercise[] | null };

type SessionRow = {
  target_sets: number;
  rep_floor: number;
  sort_order: number;
  exercises: Exercise | Exercise[] | null;
};

function mapExercise(
  ex: Exercise,
  target_sets: number,
  rep_floor: number,
  isPlanned: boolean,
): WorkoutExercise {
  const media = resolveExerciseMedia(ex);
  return {
    id: ex.id,
    name: ex.name,
    muscle_group: ex.muscle_group,
    instructions: ex.instructions ?? null,
    video_url: media.video_url,
    video_source: media.video_source,
    video_attribution: media.video_attribution,
    focus_muscles: media.focus_muscles,
    target_sets,
    rep_floor,
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
        mapExercise(ex, row.target_sets, row.rep_floor, true),
      ),
    ) ?? [];

  if (!isRoutineSession) {
    return (sessionExtras ?? []).flatMap((item) =>
      flattenJoin(item, (ex, row) =>
        mapExercise(ex, row.target_sets, row.rep_floor, true),
      ),
    );
  }

  const plannedIds = new Set(planned.map((p) => p.id));
  const extras = (sessionExtras ?? []).flatMap((item) => {
    const ex = Array.isArray(item.exercises) ? item.exercises[0] : item.exercises;
    if (!ex || plannedIds.has(ex.id)) return [];
    return [mapExercise(ex, item.target_sets, item.rep_floor, false)];
  });

  return [...planned, ...extras];
}
