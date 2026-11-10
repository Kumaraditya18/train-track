"use server";

import { requireAdmin } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import gifMap from "@/data/exercise-gif-map.json";
import { revalidatePath } from "next/cache";

type MapEntry = {
  gifUrl: string;
  video_source: string;
  video_attribution: string;
  focus_muscles: string[];
};

const map = gifMap as Record<string, MapEntry>;

export async function syncExerciseGifsFromMap(): Promise<{ updated: number; total: number }> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: rows, error } = await supabase.from("exercises").select("id, name");
  if (error) throw new Error(error.message);

  let updated = 0;
  for (const row of rows ?? []) {
    const hit = map[row.name];
    if (!hit) continue;
    const { error: upErr } = await supabase
      .from("exercises")
      .update({
        video_url: hit.gifUrl,
        video_source: hit.video_source,
        video_attribution: hit.video_attribution,
        focus_muscles: hit.focus_muscles,
      })
      .eq("id", row.id);
    if (!upErr) updated++;
  }

  await supabase
    .from("exercises")
    .update({ video_url: null, video_source: null, video_attribution: null })
    .or("video_url.ilike.%exercise-video%,video_url.ilike.%.mov");

  revalidatePath("/admin/exercises");
  revalidatePath("/workout");
  return { updated, total: rows?.length ?? 0 };
}

export async function syncExerciseGifsForm(): Promise<void> {
  await syncExerciseGifsFromMap();
}
