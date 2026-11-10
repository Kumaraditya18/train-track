import { previousIsoWeekKey } from "@/lib/dates/iso-week";
import { isoWeekMondayYmd } from "@/lib/dates/week-display";
import type { SetLog } from "@/lib/training/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/** No embed — keeps PostgREST on set_logs index seek; names fetched in one batched query. */
const SET_LOG_SELECT =
  "id, session_id, user_id, exercise_id, set_index, weight_kg, reps, logged_at";

const TWO_WEEK_LOG_LIMIT = 96;
const EXTENDED_WEEKS = 52;
const EXTENDED_LIMIT = 600;

type LeanRow = SetLog;

export function istWeekStartIso(weekKey: string): string | null {
  const mon = isoWeekMondayYmd(weekKey);
  if (!mon) return null;
  const istMidnightUtcMs =
    Date.UTC(mon.year, mon.month - 1, mon.day, 0, 0, 0) - 5.5 * 60 * 60 * 1000;
  return new Date(istMidnightUtcMs).toISOString();
}

export function twoWeekWindowSinceIso(currentWeekKey: string): string {
  const prevKey = previousIsoWeekKey(currentWeekKey);
  return istWeekStartIso(prevKey) ?? new Date(Date.now() - 14 * 86400000).toISOString();
}

export type NamedLog = SetLog & { exercise_name: string };

export function attachExerciseNames(
  rows: LeanRow[],
  names: { id: string; name: string }[] | null | undefined,
): NamedLog[] {
  const map = new Map((names ?? []).map((e) => [e.id, e.name]));
  return rows.map((row) => ({
    ...row,
    exercise_name: map.get(row.exercise_id) ?? "Exercise",
  }));
}

export type SetLogFetchMode = "two-weeks" | "extended";

async function querySetLogs(
  supabase: SupabaseClient,
  userId: string,
  currentWeekKey: string,
  mode: SetLogFetchMode,
) {
  const extended = mode === "extended";
  const since = extended
    ? new Date(Date.now() - EXTENDED_WEEKS * 7 * 86400000).toISOString()
    : twoWeekWindowSinceIso(currentWeekKey);
  const limit = extended ? EXTENDED_LIMIT : TWO_WEEK_LOG_LIMIT;

  return supabase
    .from("set_logs")
    .select(SET_LOG_SELECT)
    .eq("user_id", userId)
    .gte("logged_at", since)
    .order("logged_at", { ascending: false })
    .limit(limit);
}

/** Preferred loader: 2 HTTP calls, index-friendly set_logs scan. */
export async function fetchSetLogsWithNames(
  supabase: SupabaseClient,
  userId: string,
  currentWeekKey: string,
  mode: SetLogFetchMode = "two-weeks",
): Promise<{ data: NamedLog[]; error: Error | null }> {
  const { data: rows, error } = await querySetLogs(supabase, userId, currentWeekKey, mode);
  if (error) return { data: [], error };
  const lean = (rows ?? []) as LeanRow[];
  if (lean.length === 0) return { data: [], error: null };

  const ids = [...new Set(lean.map((r) => r.exercise_id))];
  const { data: names, error: nameError } = await supabase
    .from("exercises")
    .select("id, name")
    .in("id", ids);

  if (nameError) return { data: [], error: nameError };

  return { data: attachExerciseNames(lean, names), error: null };
}

/** @deprecated use fetchSetLogsWithNames */
export async function fetchSetLogs(
  supabase: SupabaseClient,
  userId: string,
  currentWeekKey: string,
  mode: SetLogFetchMode = "two-weeks",
) {
  return querySetLogs(supabase, userId, currentWeekKey, mode);
}

/** @deprecated use attachExerciseNames via fetchSetLogsWithNames */
export function mapSetLogRows(rows: unknown) {
  return (rows as NamedLog[]) ?? [];
}
