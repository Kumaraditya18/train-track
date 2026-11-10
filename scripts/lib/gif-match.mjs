/** Shared strict matcher: ExerciseGymGifsDB (jsDelivr). */

export const GIFDB_JSON =
  "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/api/en/exercises.json";

/** Exact slug overrides where our gym name ≠ catalog slug. */
export const SLUG_OVERRIDES = {
  "Barbell back squat": "barbell-full-squat",
  "Conventional deadlift": "barbell-deadlift",
  "Romanian deadlift": "barbell-romanian-deadlift",
  "Front squat": "barbell-front-squat",
  "Barbell bench press": "barbell-bench-press",
  "Incline barbell bench press": "barbell-incline-bench-press",
  "Incline dumbbell press": "dumbbell-incline-bench-press",
  "Dumbbell flat bench press": "dumbbell-bench-press",
  "Close-grip bench press": "barbell-close-grip-bench-press",
  "Barbell row": "barbell-bent-over-row",
  "Pendlay row": "barbell-pendlay-row",
  "Pull-up": "pull-up",
  "Chin-up": "chin-up",
  "Lat pulldown": "cable-lat-pulldown-full-range-of-motion",
  "Reverse-grip lat pulldown": "reverse-grip-machine-lat-pulldown",
  "Seated cable row": "cable-seated-row",
  "Chest-supported row": "dumbbell-incline-row",
  "Overhead press": "barbell-standing-wide-military-press",
  "Dumbbell shoulder press": "dumbbell-seated-shoulder-press",
  "Machine shoulder press": "lever-military-press",
  "Lateral raise": "dumbbell-lateral-raise",
  "Face pull": "cable-standing-rear-delt-row-with-rope",
  "Rear delt fly": "dumbbell-reverse-fly",
  "Reverse pec deck fly": "lever-seated-reverse-fly",
  "Pec deck fly": "lever-seated-fly",
  "Cable chest fly": "cable-incline-fly",
  "Barbell curl": "barbell-curl",
  "Dumbbell hammer curl": "dumbbell-hammer-curl",
  "EZ-bar skull crusher": "barbell-lying-triceps-extension-skull-crusher",
  "Tricep rope pushdown": "cable-triceps-pushdown-v-bar",
  "Leg press": "sled-45-leg-press",
  "Leg extension": "lever-leg-extension",
  "Lying leg curl": "lever-lying-leg-curl",
  "Seated leg curl": "lever-seated-leg-curl",
  "Walking lunge": "walking-lunge",
  "Bulgarian split squat": "dumbbell-single-leg-split-squat",
  "Hip thrust": "barbell-glute-bridge",
  "Standing calf raise": "lever-standing-calf-raise",
  "Cable crunch": "cable-kneeling-crunch",
  "Hanging leg raise": "hanging-leg-raise",
  "Plank": "weighted-front-plank",
  "Farmer carry": "farmers-walk",
  "Dumbbell goblet squat": "dumbbell-goblet-squat",
  "Machine chest press": "lever-chest-press",
  "Barbell shrug": "barbell-shrug",
  "Push-up": "push-up",
};

const STOP = new Set(
  "a an the and or with on in to of for v2".split(" ").concat(["exercise", "variation", "alternate", "single", "double"]),
);

const EQUIPMENT = [
  "barbell",
  "dumbbell",
  "cable",
  "band",
  "kettlebell",
  "machine",
  "lever",
  "sled",
  "smith",
  "ez",
  "rope",
  "assisted",
  "weighted",
  "bodyweight",
  "trap",
];

export function norm(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function nameToSlug(name) {
  return norm(name).replace(/\s+/g, "-");
}

/** Wger / seed quirks: "3008 Abdominal Crunch", "Name (RDL)", etc. */
export function nameVariants(ourName) {
  const variants = new Set([ourName]);
  const noParen = ourName.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  if (noParen) variants.add(noParen);
  const noNum = ourName.replace(/^\d+\s*/, "").trim();
  if (noNum) variants.add(noNum);
  if (noParen) variants.add(noParen.replace(/^\d+\s*/, "").trim());
  return [...variants].filter(Boolean);
}

export function significantTokens(name) {
  const tokens = norm(name).split(" ").filter((w) => w.length > 1 && !STOP.has(w));
  return new Set(tokens);
}

export function detectEquipment(name) {
  const n = norm(name);
  const found = new Set();
  for (const eq of EQUIPMENT) {
    if (n.includes(eq)) found.add(eq);
  }
  if (n.includes("ez bar") || n.includes("ez-bar")) found.add("ez");
  if (n.includes("push up") || n.includes("push-up")) found.add("bodyweight");
  if (n.includes("pull up") || n.includes("pull-up")) found.add("bodyweight");
  if (n.includes("chin up") || n.includes("chin-up")) found.add("bodyweight");
  if (n.includes("pec deck") || n.includes("machine")) found.add("machine");
  if (n.includes("leg press")) found.add("sled");
  return found;
}

function equipmentCompatible(ourName, candidate) {
  const ours = detectEquipment(ourName);
  if (ours.size === 0) return true;
  const candEq = new Set([candidate.equipment, ...detectEquipment(candidate.name)].filter(Boolean));
  const cn = norm(candidate.name);
  for (const eq of ours) {
    if (candEq.has(eq)) continue;
    if (eq === "machine" && (candEq.has("lever") || cn.includes("lever"))) continue;
    if (eq === "sled" && cn.includes("leg press")) continue;
    if (eq === "ez" && (cn.includes("ez") || cn.includes("skull") || cn.includes("triceps extension"))) continue;
    if (cn.includes(eq)) continue;
    return false;
  }
  return true;
}

function rankCandidate(ourName, c) {
  if (!equipmentCompatible(ourName, c)) return -1;

  const ourT = significantTokens(ourName);
  const candT = significantTokens(c.name);
  if (ourT.size === 0) return -1;

  let shared = 0;
  for (const t of ourT) if (candT.has(t)) shared++;

  const recall = shared / ourT.size;
  const precision = shared / Math.max(candT.size, 1);

  const recallMin = ourT.size <= 3 ? 0.82 : 0.62;
  if (recall < recallMin) return -1;

  let score = recall * 70 + precision * 25;
  const extra = [...candT].filter((t) => !ourT.has(t) && !STOP.has(t)).length;
  score -= extra * 6;

  const ourNorm = norm(ourName);
  const candNorm = norm(c.name);
  if (ourNorm === candNorm) score += 100;
  if (candNorm.includes(ourNorm) || ourNorm.includes(candNorm)) score += 15;

  return score;
}

export function buildCatalogIndex(exercises) {
  const bySlug = new Map();
  const byNormName = new Map();
  for (const ex of exercises) {
    if (!ex.gifUrl) continue;
    bySlug.set(ex.slug, ex);
    byNormName.set(norm(ex.name), ex);
  }
  return { bySlug, byNormName, all: exercises.filter((e) => e.gifUrl) };
}

export function matchExerciseToGif(ourName, index) {
  for (const variant of nameVariants(ourName)) {
    const overrideSlug = SLUG_OVERRIDES[variant] ?? SLUG_OVERRIDES[ourName];
    if (overrideSlug && index.bySlug.has(overrideSlug)) {
      return { exercise: index.bySlug.get(overrideSlug), method: "override", score: 1000 };
    }

    const slug = nameToSlug(variant);
    if (index.bySlug.has(slug)) {
      return { exercise: index.bySlug.get(slug), method: "slug", score: 950 };
    }

    const nn = norm(variant);
    if (index.byNormName.has(nn)) {
      return { exercise: index.byNormName.get(nn), method: "exact-name", score: 900 };
    }
  }

  let best = null;
  let bestScore = -1;
  for (const variant of nameVariants(ourName)) {
    for (const c of index.all) {
      const s = rankCandidate(variant, c);
      if (s > bestScore) {
        bestScore = s;
        best = c;
      }
    }
  }

  if (best && bestScore >= 52) {
    return { exercise: best, method: "fuzzy", score: bestScore };
  }
  return null;
}

export async function loadGifCatalog() {
  const res = await fetch(GIFDB_JSON);
  if (!res.ok) throw new Error(`gifdb HTTP ${res.status}`);
  const data = await res.json();
  return buildCatalogIndex(data.exercises ?? []);
}

export function gifPayload(ourName, match) {
  const ex = match.exercise;
  const focus = [ex.muscle, ...(ex.secondaryMuscles ?? [])].filter(Boolean);
  return {
    name: ourName,
    matchedName: ex.name,
    slug: ex.slug,
    method: match.method,
    score: match.score,
    gifUrl: ex.gifUrl,
    focus_muscles: focus,
    video_source: "gifdb",
    video_attribution: `${ex.name} · ExerciseGymGifsDB (jsDelivr)`,
  };
}
