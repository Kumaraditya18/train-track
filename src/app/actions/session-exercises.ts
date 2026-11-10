"use server";

import { requireProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult = { error?: string };

async function assertOpenSession(sessionId: string, userId: string) {
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("workout_sessions")
    .select("id, user_id, routine_id, finished_at")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session || session.user_id !== userId || session.finished_at) {
    return { error: "Session not found or already finished." as const, session: null };
  }
  return { error: null, session };
}

export async function addExerciseToSession(
  sessionId: string,
  exerciseId: string,
): Promise<ActionResult> {
  const profile = await requireProfile();
  const check = await assertOpenSession(sessionId, profile.id);
  if (check.error || !check.session) return { error: check.error ?? "Session error." };

  const supabase = await createClient();

  if (check.session.routine_id) {
    const { data: inRoutine } = await supabase
      .from("routine_items")
      .select("exercise_id")
      .eq("routine_id", check.session.routine_id)
      .eq("exercise_id", exerciseId)
      .maybeSingle();
    if (inRoutine) {
      return { error: "That exercise is already in today's plan." };
    }
  }

  const { count } = await supabase
    .from("session_exercises")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);

  const sortOrder = (count ?? 0) + 1;

  const { error } = await supabase.from("session_exercises").insert({
    session_id: sessionId,
    exercise_id: exerciseId,
    sort_order: sortOrder,
    target_sets: 3,
    rep_floor: 8,
  });

  if (error) {
    if (error.code === "23505") return { error: "That exercise is already in this workout." };
    return { error: error.message };
  }

  revalidatePath(`/workout/${sessionId}`);
  return {};
}

/** Only removes optional extras (session_exercises rows), not today's routine plan. */
export async function removeExerciseFromSession(
  sessionId: string,
  exerciseId: string,
): Promise<ActionResult> {
  const profile = await requireProfile();
  const check = await assertOpenSession(sessionId, profile.id);
  if (check.error) return { error: check.error };

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("session_exercises")
    .select("id")
    .eq("session_id", sessionId)
    .eq("exercise_id", exerciseId)
    .maybeSingle();

  if (!row) {
    return { error: "Only optional add-on exercises can be removed — not today's plan." };
  }

  const { error } = await supabase
    .from("session_exercises")
    .delete()
    .eq("session_id", sessionId)
    .eq("exercise_id", exerciseId);

  if (error) return { error: error.message };
  revalidatePath(`/workout/${sessionId}`);
  return {};
}
