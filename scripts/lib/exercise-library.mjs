import { GIFDB_JSON, SLUG_OVERRIDES, loadGifCatalog } from "./gif-match.mjs";

const BODY_TO_MUSCLE = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  arms: "Arms",
  legs: "Legs",
  core: "Core",
};

const ROUTINE_SLUGS = [
  "dumbbell-incline-bench-press",
  "lever-military-press",
  "lever-chest-press",
  "dumbbell-lateral-raise",
  "lever-seated-fly",
  "barbell-shrug",
  "push-up",
  "pull-up",
  "lever-front-pulldown",
  "barbell-bent-over-row",
  "reverse-grip-machine-lat-pulldown",
  "cable-seated-row",
  "cable-standing-rear-delt-row-with-rope",
  "barbell-full-squat",
  "sled-45-leg-press",
  "barbell-romanian-deadlift",
  "lever-lying-leg-curl",
  "lever-standing-calf-raise",
  "barbell-curl",
  "dumbbell-hammer-curl",
  "cable-triceps-pushdown-v-bar",
  "barbell-lying-triceps-extension-skull-crusher",
  "cable-kneeling-crunch",
  "weighted-front-plank",
  "dumbbell-bench-press",
  "dumbbell-seated-shoulder-press",
  "dumbbell-single-leg-split-squat",
  "barbell-glute-bridge",
  "lever-leg-extension",
  "lever-seated-leg-curl",
  "walking-lunge",
];

const EXTRA_COMMON_SLUGS = [
  "barbell-bench-press",
  "barbell-deadlift",
  "barbell-front-squat",
  "barbell-incline-bench-press",
  "chin-up",
  "barbell-close-grip-bench-press",
  "barbell-pendlay-row",
  "dumbbell-goblet-squat",
  "barbell-standing-wide-military-press",
  "dumbbell-reverse-fly",
  "lever-seated-reverse-fly",
  "cable-incline-fly",
  "hanging-leg-raise",
  "farmers-walk",
  "front-squat",
  "lever-chest-press",
  "cable-crossover",
  "dumbbell-row",
  "barbell-curl",
];

function friendlyNameForSlug(slug, catalogEx) {
  const fromOverride = Object.entries(SLUG_OVERRIDES).find(([, s]) => s === slug);
  if (fromOverride) return fromOverride[0];
  return catalogEx.name;
}

function isCommonStrength(ex) {
  if (ex.category !== "strength") return false;
  const n = `${ex.name} ${ex.slug}`.toLowerCase();
  if (
    /yoga|stretch|warmup|bosu|exercise ball|arm blaster|pov\b|female\b|male\b|throw down|slinger|wheel roller|sit up\b.*barbell press/.test(
      n,
    )
  )
    return false;
  if (/^\d|[\d] ?\d |assisted/.test(ex.name)) return false;
  if (ex.name.split(/\s+/).length > 5) return false;
  if (ex.equipment === "band") return false;
  return ["barbell", "dumbbell", "cable", "lever", "sled", "bodyweight", "smith", "kettlebell", "ez"].includes(
    ex.equipment,
  );
}

/** One primary lift per slug; extras only if clearly mainstream. */
const ALLOW_EXTRA_SLUG_PREFIX = [
  "barbell-",
  "dumbbell-bench",
  "dumbbell-incline",
  "dumbbell-row",
  "dumbbell-lateral",
  "dumbbell-goblet",
  "cable-seated",
  "cable-triceps",
  "cable-lat",
  "cable-cross",
  "lever-leg",
  "lever-chest",
  "lever-shoulder",
  "lever-lying",
  "lever-seated-leg",
  "sled-45",
  "chin-up",
  "pull-up",
  "push-up",
  "hanging-leg",
  "kettlebell-swing",
];

export async function buildCuratedLibrary(maxExtra = 70) {
  const { bySlug, all } = await loadGifCatalog();

  const slugSet = new Set([...ROUTINE_SLUGS, ...EXTRA_COMMON_SLUGS]);
  for (const ex of all.filter(isCommonStrength)) {
    if (slugSet.size >= ROUTINE_SLUGS.length + EXTRA_COMMON_SLUGS.length + maxExtra) break;
    if (!ALLOW_EXTRA_SLUG_PREFIX.some((p) => ex.slug.startsWith(p))) continue;
    slugSet.add(ex.slug);
  }

  const slugToFriendly = new Map();
  for (const [friendly, slug] of Object.entries(SLUG_OVERRIDES)) {
    slugToFriendly.set(slug, friendly);
  }

  const library = [];
  for (const slug of [...slugSet].sort()) {
    const ex = bySlug.get(slug);
    if (!ex?.gifUrl) continue;
    const name = slugToFriendly.get(slug) ?? friendlyNameForSlug(slug, ex);
    const focus = [ex.muscle, ...(ex.secondaryMuscles ?? [])].filter(Boolean);
    library.push({
      name,
      slug,
      muscle_group: BODY_TO_MUSCLE[ex.bodyPart] ?? "General",
      instructions: (ex.instructions ?? []).slice(0, 4).join(" ") || "Use controlled reps and full range.",
      video_url: ex.gifUrl,
      video_source: "gifdb",
      video_attribution: `${ex.name} · ExerciseGymGifsDB (jsDelivr)`,
      focus_muscles: focus,
      catalog_name: ex.name,
    });
  }
  library.sort((a, b) => a.name.localeCompare(b.name));
  return library;
}

export { SLUG_OVERRIDES, GIFDB_JSON };
