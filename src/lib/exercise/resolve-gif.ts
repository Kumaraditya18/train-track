import gifMap from "@/data/exercise-gif-map.json";

export type ExerciseMediaFields = {
  name: string;
  muscle_group?: string | null;
  video_url?: string | null;
  video_source?: string | null;
  video_attribution?: string | null;
  focus_muscles?: string[] | null;
};

type MapEntry = {
  gifUrl: string;
  matchedName: string;
  method: string;
  score: number;
  focus_muscles: string[];
  video_source: string;
  video_attribution: string;
};

const map = gifMap as Record<string, MapEntry>;

/** Prefer curated map (strict match) over whatever is stored in the DB. */
export function resolveExerciseMedia(ex: ExerciseMediaFields): {
  video_url: string | null;
  video_source: string | null;
  video_attribution: string | null;
  focus_muscles: string[] | null;
} {
  const hit = map[ex.name];
  if (hit) {
    return {
      video_url: hit.gifUrl,
      video_source: hit.video_source,
      video_attribution: hit.video_attribution,
      focus_muscles: hit.focus_muscles,
    };
  }
  return {
    video_url: ex.video_url ?? null,
    video_source: ex.video_source ?? null,
    video_attribution: ex.video_attribution ?? null,
    focus_muscles: ex.focus_muscles ?? null,
  };
}
