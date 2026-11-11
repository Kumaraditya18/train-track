"use server";

import { requireAdmin } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResult = { error?: string };

export async function upsertExercise(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  const muscleGroup = String(formData.get("muscle_group") ?? "").trim() || null;
  const instructions = String(formData.get("instructions") ?? "").trim() || null;
  const videoUrl = String(formData.get("video_url") ?? "").trim() || null;
  const videoAttribution = String(formData.get("video_attribution") ?? "").trim() || null;
  const videoSource = videoUrl
    ? videoUrl.toLowerCase().includes(".gif")
      ? "gifdb"
      : "custom"
    : null;

  if (!name) throw new Error("Exercise name is required.");

  const supabase = await createClient();
  const payload = {
    name,
    muscle_group: muscleGroup,
    instructions,
    video_url: videoUrl,
    video_attribution: videoAttribution,
    video_source: videoSource,
  };
  if (id) {
    const { error } = await supabase.from("exercises").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("exercises").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/exercises");
  revalidatePath("/workout");
  revalidatePath("/dashboard");
}

export async function deleteExercise(exerciseId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("exercises").delete().eq("id", exerciseId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/exercises");
}

export async function deleteExerciseForm(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing exercise id.");
  await deleteExercise(id);
}

export async function upsertRoutine(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim() || null;
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const isDaily = formData.get("is_recommended_daily") === "on";

  if (!name) throw new Error("Routine name is required.");

  const supabase = await createClient();

  if (isDaily) {
    await supabase.from("routines").update({ is_recommended_daily: false }).neq("id", id ?? "");
  }

  let routineId = id;
  if (id) {
    const { error } = await supabase
      .from("routines")
      .update({ name, description, is_recommended_daily: isDaily })
      .eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await supabase
      .from("routines")
      .insert({ name, description, is_recommended_daily: isDaily })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    routineId = data.id;
  }

  revalidatePath("/admin/routines");
  revalidatePath("/workout");
}

export async function saveRoutineItems(routineId: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const raw = String(formData.get("items_json") ?? "[]");
  let items: {
    exercise_id: string;
    sort_order: number;
    target_sets: number;
    rep_floor: number;
    rep_ceiling: number;
  }[];

  try {
    items = JSON.parse(raw);
  } catch {
    return { error: "Invalid routine items payload." };
  }

  const supabase = await createClient();
  const { error: delErr } = await supabase.from("routine_items").delete().eq("routine_id", routineId);
  if (delErr) return { error: delErr.message };

  if (items.length === 0) {
    revalidatePath(`/admin/routines/${routineId}`);
    return {};
  }

  const { error } = await supabase.from("routine_items").insert(
    items.map((item) => ({
      routine_id: routineId,
      exercise_id: item.exercise_id,
      sort_order: item.sort_order,
      target_sets: item.target_sets,
      rep_floor: item.rep_floor,
      rep_ceiling: item.rep_ceiling ?? 12,
    })),
  );

  if (error) return { error: error.message };
  revalidatePath(`/admin/routines/${routineId}`);
  revalidatePath("/workout");
  return {};
}
