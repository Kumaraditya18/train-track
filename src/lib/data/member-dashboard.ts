import { loadMemberToday } from "@/lib/dates/member-today";
import { buildOverloadHints } from "@/lib/training/overload-target";
import { weeklyBestsFromLogs } from "@/lib/training/weekly-max";
import type { OverloadHint, SetLog, WorkoutSession } from "@/lib/training/types";
import { createClient } from "@/lib/supabase/server";

export async function loadMemberDashboard(userId: string) {
  const supabase = await createClient();
  const today = await loadMemberToday();

  const [{ data: recentSessions }, { data: logsWithNames }, { data: routineItems }] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("id, title, started_at, finished_at, routine_id")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(5),
    supabase
      .from("set_logs")
      .select("id, session_id, user_id, exercise_id, set_index, weight_kg, reps, logged_at, exercises(name)")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false })
      .limit(500),
    supabase.from("routine_items").select("exercise_id, rep_floor, exercises(name)"),
  ]);

  const namedLogs = (logsWithNames ?? []).map((row) => {
    const exerciseJoin = row.exercises as { name: string } | { name: string }[] | null;
    const name = Array.isArray(exerciseJoin) ? exerciseJoin[0]?.name : exerciseJoin?.name;
    return {
      ...(row as SetLog),
      exercise_name: name ?? "Exercise",
    };
  });

  const weeklyBests = weeklyBestsFromLogs(namedLogs);
  const repFloors = new Map<string, { name: string; repFloor: number }>();

  for (const item of routineItems ?? []) {
    const exJoin = item.exercises as { name: string } | { name: string }[] | null;
    const name = Array.isArray(exJoin) ? exJoin[0]?.name : exJoin?.name;
    if (!name) continue;
    repFloors.set(item.exercise_id, { name, repFloor: item.rep_floor });
  }

  for (const best of weeklyBests) {
    if (!repFloors.has(best.exerciseId)) {
      repFloors.set(best.exerciseId, { name: best.exerciseName, repFloor: 8 });
    }
  }

  const hints: OverloadHint[] = buildOverloadHints({
    weekKey: today.weekKey,
    repFloorsByExercise: repFloors,
    weeklyBests,
  });

  return {
    ...today,
    dailyRoutine: today.todaysRoutine,
    recentSessions: (recentSessions as WorkoutSession[]) ?? [],
    hints: hints.slice(0, 8),
  };
}
