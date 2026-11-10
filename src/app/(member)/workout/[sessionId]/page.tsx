import { finishWorkoutForm } from "@/app/actions/workouts";
import { WorkoutSessionView } from "@/components/workout/WorkoutSessionView";
import { requireProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
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
    .select(`target_sets, rep_floor, sort_order, exercises(${exerciseSelect})`)
    .eq("session_id", sessionId)
    .order("sort_order");

  const logsQuery = supabase
    .from("set_logs")
    .select("exercise_id, set_index")
    .eq("session_id", sessionId)
    .order("set_index");

  const routineItemsQuery = session.routine_id
    ? supabase
        .from("routine_items")
        .select(`target_sets, rep_floor, sort_order, exercises(${exerciseSelect})`)
        .eq("routine_id", session.routine_id)
        .order("sort_order")
    : null;

  const [routineResult, sessionItemsResult, logsResult] = await Promise.all([
    routineItemsQuery ?? Promise.resolve({ data: null }),
    sessionItemsQuery,
    logsQuery,
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
      />
    </div>
  );
}
