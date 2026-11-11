import { finishWorkoutForm } from "@/app/actions/workouts";
import { WorkoutSessionView } from "@/components/workout/WorkoutSessionView";
import { requireProfile } from "@/lib/auth/profile";
import { attachExerciseNames, fetchSetLogsWithNames } from "@/lib/data/set-logs";
import { loadMemberToday } from "@/lib/dates/member-today";
import { createClient } from "@/lib/supabase/server";
import {
  progressionForExercise,
  type ExerciseProgression,
} from "@/lib/training/set-progression";
import type { SetLog } from "@/lib/training/types";
import { mergeSessionExercises } from "@/lib/workout/session-exercise-list";
import type { Exercise, RoutineItem } from "@/lib/training/types";
import { notFound } from "next/navigation";

type ItemRow = RoutineItem & { exercises: Exercise | Exercise[] | null };

const exerciseSelect = "id, name, muscle_group";

export default async function ActiveWorkoutPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("workout_sessions")
    .select("id, title, routine_id, finished_at, user_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.user_id !== profile.id) notFound();

  const finished = Boolean(session.finished_at);
  const isRoutineSession = Boolean(session.routine_id);

  const sessionItemsQuery = supabase
    .from("session_exercises")
    .select(`target_sets, rep_floor, rep_ceiling, sort_order, exercises(${exerciseSelect})`)
    .eq("session_id", sessionId)
    .order("sort_order");

  const logsQuery = supabase
    .from("set_logs")
    .select("id, session_id, user_id, exercise_id, set_index, weight_kg, reps, logged_at")
    .eq("session_id", sessionId)
    .order("set_index");

  const routineItemsQuery = session.routine_id
    ? supabase
        .from("routine_items")
        .select(`target_sets, rep_floor, rep_ceiling, sort_order, exercises(${exerciseSelect})`)
        .eq("routine_id", session.routine_id)
        .order("sort_order")
    : null;

  const today = await loadMemberToday();

  const [routineResult, sessionItemsResult, logsResult, historyLogsPack] = await Promise.all([
    routineItemsQuery ?? Promise.resolve({ data: null }),
    sessionItemsQuery,
    logsQuery,
    fetchSetLogsWithNames(supabase, profile.id, today.weekKey, "two-weeks"),
  ]);

  const routineItems = (routineResult.data as ItemRow[] | null) ?? null;
  const sessionItems = sessionItemsResult.data;

  const exercises = mergeSessionExercises(
    routineItems,
    sessionItems as Parameters<typeof mergeSessionExercises>[1],
    isRoutineSession,
  );

  const logs = logsResult.data;

  const nextSetByExercise: Record<string, number> = {};
  for (const log of logs ?? []) {
    const current = nextSetByExercise[log.exercise_id] ?? 1;
    nextSetByExercise[log.exercise_id] = Math.max(current, log.set_index + 1);
  }

  const exerciseNames = exercises.map((e) => ({ id: e.id, name: e.name }));
  const sessionNamed = attachExerciseNames((logs ?? []) as SetLog[], exerciseNames);
  const mergedById = new Map<string, (typeof historyLogsPack.data)[number]>();
  for (const row of historyLogsPack.data) mergedById.set(row.id, row);
  for (const row of sessionNamed) mergedById.set(row.id, row);
  const mergedLogs = [...mergedById.values()];

  const progressionByExerciseId: Record<string, ExerciseProgression> = {};
  for (const ex of exercises) {
    const card = progressionForExercise(mergedLogs, ex.id, {
      repMin: ex.rep_floor,
      repMax: ex.rep_ceiling,
    });
    if (card) progressionByExerciseId[ex.id] = card;
  }

  return (
    <div className="workout-page min-w-0 pb-2">
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-medium text-muted">{session.title}</p>
        {!finished ? (
          <form action={finishWorkoutForm} className="shrink-0">
            <input type="hidden" name="session_id" value={sessionId} />
            <button
              type="submit"
              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-muted transition-colors hover:bg-elevated hover:text-fg"
            >
              End session
            </button>
          </form>
        ) : (
          <span className="text-xs font-medium text-accent">Complete</span>
        )}
      </div>

      <WorkoutSessionView
        sessionId={sessionId}
        finished={finished}
        isRoutineSession={isRoutineSession}
        exercises={exercises}
        nextSetByExercise={nextSetByExercise}
        progressionByExerciseId={progressionByExerciseId}
      />
    </div>
  );
}
