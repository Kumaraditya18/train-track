import { fetchSetLogsWithNames } from "@/lib/data/set-logs";
import { loadMemberToday } from "@/lib/dates/member-today";
import { buildOverloadHints, type RepBandByExercise } from "@/lib/training/overload-target";
import { weeklyBestsFromLogs } from "@/lib/training/weekly-max";
import type { WorkoutSession } from "@/lib/training/types";
import { createClient } from "@/lib/supabase/server";

export async function loadMemberDashboard(userId: string) {
  const supabase = await createClient();
  const today = await loadMemberToday();
  const weekKey = today.weekKey;

  const todayRoutineItemsQuery = today.todaysRoutine
    ? supabase
        .from("routine_items")
        .select("exercise_id, rep_floor, rep_ceiling, exercises(name)")
        .eq("routine_id", today.todaysRoutine.id)
    : Promise.resolve({
        data: [] as { exercise_id: string; rep_floor: number; rep_ceiling: number; exercises: unknown }[],
      });

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

  const repBands: RepBandByExercise = new Map();

  for (const item of todayItemsResult.data ?? []) {
    const exJoin = item.exercises as { name: string } | { name: string }[] | null;
    const name = Array.isArray(exJoin) ? exJoin[0]?.name : exJoin?.name;
    if (!name) continue;
    repBands.set(item.exercise_id, {
      name,
      repMin: item.rep_floor,
      repMax: item.rep_ceiling ?? 12,
    });
  }

  const missingIds = [...exerciseIds].filter((id) => !repBands.has(id));
  if (missingIds.length > 0) {
    const { data: routineItems } = await supabase
      .from("routine_items")
      .select("exercise_id, rep_floor, rep_ceiling, exercises(name)")
      .in("exercise_id", missingIds);

    for (const item of routineItems ?? []) {
      const exJoin = item.exercises as { name: string } | { name: string }[] | null;
      const name = Array.isArray(exJoin) ? exJoin[0]?.name : exJoin?.name;
      if (!name) continue;
      const prev = repBands.get(item.exercise_id);
      repBands.set(item.exercise_id, {
        name,
        repMin: prev ? Math.max(prev.repMin, item.rep_floor) : item.rep_floor,
        repMax: prev ? Math.max(prev.repMax, item.rep_ceiling ?? 12) : (item.rep_ceiling ?? 12),
      });
    }
  }

  const weeklyBests = weeklyBestsFromLogs(namedLogs);

  for (const best of weeklyBests) {
    if (!repBands.has(best.exerciseId)) {
      repBands.set(best.exerciseId, { name: best.exerciseName, repMin: 5, repMax: 12 });
    }
  }

  const hints = buildOverloadHints({
    weekKey,
    repBandsByExercise: repBands,
    weeklyBests,
  });

  return {
    ...today,
    dailyRoutine: today.todaysRoutine,
    recentSessions: (recentSessions as WorkoutSession[]) ?? [],
    hints: hints.slice(0, 8),
  };
}
