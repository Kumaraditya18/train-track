"use server";

import { requireProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ActionResult = { error?: string };

export async function startWorkout(formData: FormData): Promise<void> {
  const profile = await requireProfile();
  const routineId = String(formData.get("routine_id") ?? "").trim() || null;
  const customTitle = String(formData.get("title") ?? "").trim();

  const supabase = await createClient();

  let title = customTitle;
  if (routineId) {
    const { data: routine } = await supabase
      .from("routines")
      .select("name")
      .eq("id", routineId)
      .maybeSingle();
    title = routine?.name ?? "Workout";
  }
  if (!title) title = "Custom workout";

  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: profile.id,
      routine_id: routineId,
      title,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  redirect(`/workout/${data.id}`);
}

export async function logSet(sessionId: string, formData: FormData): Promise<ActionResult> {
  const profile = await requireProfile();
  const exerciseId = String(formData.get("exercise_id") ?? "");
  const setIndex = Number(formData.get("set_index"));
  const weightKg = Number(formData.get("weight_kg"));
  const reps = Number(formData.get("reps"));

  if (!exerciseId || !Number.isFinite(setIndex) || setIndex < 1) {
    return { error: "Invalid set." };
  }
  if (!Number.isFinite(weightKg) || weightKg < 0) {
    return { error: "Enter a valid weight." };
  }
  if (!Number.isFinite(reps) || reps < 0) {
    return { error: "Enter valid reps." };
  }

  const supabase = await createClient();
  const { data: session } = await supabase
    .from("workout_sessions")
    .select("id, user_id, finished_at")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.user_id !== profile.id || session.finished_at) {
    return { error: "Session not found or already finished." };
  }

  const { error } = await supabase.from("set_logs").insert({
    session_id: sessionId,
    user_id: profile.id,
    exercise_id: exerciseId,
    set_index: setIndex,
    weight_kg: weightKg,
    reps,
  });

  if (error) return { error: error.message };

  revalidatePath(`/workout/${sessionId}`);
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  return {};
}

export async function finishWorkoutForm(formData: FormData): Promise<void> {
  const sessionId = String(formData.get("session_id") ?? "");
  if (!sessionId) throw new Error("Missing session.");
  await finishWorkout(sessionId);
}

export async function finishWorkout(sessionId: string): Promise<void> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("workout_sessions")
    .update({ finished_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", profile.id)
    .is("finished_at", null);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
