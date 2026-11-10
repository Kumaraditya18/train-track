import { fetchSetLogsWithNames } from "@/lib/data/set-logs";
import { loadMemberToday } from "@/lib/dates/member-today";
import { buildOverloadHints } from "@/lib/training/overload-target";
import { weeklyBestsFromLogs } from "@/lib/training/weekly-max";
import type { OverloadHint, WorkoutSession } from "@/lib/training/types";
import { createClient } from "@/lib/supabase/server";

export async function loadMemberDashboard(userId: string) {
  const supabase = await createClient();
  const today = await loadMemberToday();
  const weekKey = today.weekKey;

  const todayRoutineItemsQuery = today.todaysRoutine
    ? supabase
        .from("routine_items")
        .select("exercise_id, rep_floor, exercises(name)")
        .eq("routine_id", today.todaysRoutine.id)
    : Promise.resolve({ data: [] as { exercise_id: string; rep_floor: number; exercises: unknown }[] });

  const [{ data: recentSessions }, logsPack, todayItemsResult] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("id, title, started_at, finished_at, routine_id")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(5),
    fetchSetLogsWithNames(supabase, userId, weekKey, "two-weeks"),
    todayRoutineItemsQuery,
  ]);

  const namedLogs = logsPack.data;
  const exerciseIds = new Set<string>(namedLogs.map((l) => l.exercise_id));
  for (const item of todayItemsResult.data ?? []) {
    exerciseIds.add(item.exercise_id);
  }

  const repFloors = new Map<string, { name: string; repFloor: number }>();

  for (const item of todayItemsResult.data ?? []) {
    const exJoin = item.exercises as { name: string } | { name: string }[] | null;
    const name = Array.isArray(exJoin) ? exJoin[0]?.name : exJoin?.name;
    if (!name) continue;
    repFloors.set(item.exercise_id, { name, repFloor: item.rep_floor });
  }

  const missingRepFloorIds = [...exerciseIds].filter((id) => !repFloors.has(id));
  if (missingRepFloorIds.length > 0) {
    const { data: routineItems } = await supabase
      .from("routine_items")
      .select("exercise_id, rep_floor, exercises(name)")
      .in("exercise_id", missingRepFloorIds);

    for (const item of routineItems ?? []) {
      const exJoin = item.exercises as { name: string } | { name: string }[] | null;
      const name = Array.isArray(exJoin) ? exJoin[0]?.name : exJoin?.name;
      if (!name) continue;
      if (!repFloors.has(item.exercise_id)) {
        repFloors.set(item.exercise_id, { name, repFloor: item.rep_floor });
      }
    }
  }

  const weeklyBests = weeklyBestsFromLogs(namedLogs);

  for (const best of weeklyBests) {
    if (!repFloors.has(best.exerciseId)) {
      repFloors.set(best.exerciseId, { name: best.exerciseName, repFloor: 8 });
    }
  }

  const hints: OverloadHint[] = buildOverloadHints({
    weekKey,
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
