const GIF_HOSTS = ["cdn.jsdelivr.net", "static.exercisedb.dev"];

export function isExerciseGif(url: string | null | undefined, source?: string | null) {
  if (!url) return false;
  if (source === "gifdb" || source === "exercisedb") return true;
  try {
    const { pathname, hostname } = new URL(url);
    if (pathname.toLowerCase().endsWith(".gif")) return true;
    return GIF_HOSTS.some((h) => hostname.includes(h)) && pathname.includes(".gif");
  } catch {
    return url.toLowerCase().includes(".gif");
  }
}

export function isHeavyVideo(url: string | null | undefined, source?: string | null) {
  if (!url || isExerciseGif(url, source)) return false;
  const lower = url.toLowerCase();
  return lower.includes(".mov") || lower.includes(".mp4") || source === "wger";
}
