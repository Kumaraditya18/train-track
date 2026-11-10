"use server";

import { requireProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export type CatalogExercise = {
  id: string;
  name: string;
  muscle_group: string | null;
};

export async function fetchExerciseInstructions(
  exerciseId: string,
): Promise<{ data: string | null; error?: string }> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("exercises")
    .select("instructions")
    .eq("id", exerciseId)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data: data?.instructions?.trim() ?? null };
}

export async function searchExerciseCatalog(input: {
  query?: string;
  muscle?: string;
  excludeIds?: string[];
  limit?: number;
}): Promise<{ data: CatalogExercise[]; error?: string }> {
  await requireProfile();
  const supabase = await createClient();
  const limit = Math.min(input.limit ?? 40, 60);
  const q = input.query?.trim() ?? "";

  let builder = supabase
    .from("exercises")
    .select("id, name, muscle_group")
    .not("video_url", "is", null)
    .order("name")
    .limit(limit + (input.excludeIds?.length ?? 0));

  if (input.muscle && input.muscle !== "all") {
    builder = builder.eq("muscle_group", input.muscle);
  }
  if (q.length >= 2) {
    builder = builder.ilike("name", `%${q}%`);
  }

  const { data, error } = await builder;
  if (error) return { data: [], error: error.message };

  const exclude = new Set(input.excludeIds ?? []);
  const rows = (data ?? []).filter((row) => !exclude.has(row.id)).slice(0, limit);

  return { data: rows };
}
