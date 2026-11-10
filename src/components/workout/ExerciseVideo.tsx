"use client";

import { isExerciseGif, isHeavyVideo } from "@/lib/exercise/media";
import { useState } from "react";

function MuscleTags({ primary, muscles }: { primary?: string | null; muscles?: string[] | null }) {
  const secondary = (muscles ?? []).filter(Boolean);
  if (!primary && secondary.length === 0) return null;
  return (
    <div className="flex flex-wrap justify-center gap-1.5 px-2 pb-2">
      {primary ? (
        <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-semibold text-fg">
          {primary}
        </span>
      ) : null}
      {secondary.slice(0, 3).map((m) => (
        <span key={m} className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-medium capitalize text-muted">
          {m}
        </span>
      ))}
    </div>
  );
}

export function ExerciseVideo({
  videoUrl,
  attribution,
  title,
  videoSource,
  focusMuscles,
  muscleGroup,
  variant = "default",
}: {
  videoUrl: string;
  attribution?: string | null;
  title: string;
  videoSource?: string | null;
  focusMuscles?: string[] | null;
  muscleGroup?: string | null;
  variant?: "default" | "player";
}) {
  const [playing, setPlaying] = useState(false);
  const isPlayer = variant === "player";

  if (isExerciseGif(videoUrl, videoSource)) {
    const primary = muscleGroup ?? focusMuscles?.[0] ?? null;
    const secondary = focusMuscles?.slice(primary && muscleGroup ? 0 : 1) ?? [];

    return (
      <div
        className={
          isPlayer
            ? "player-art overflow-hidden rounded-2xl bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]"
            : "overflow-hidden rounded-xl border border-line bg-elevated/40"
        }
      >
        <div className={isPlayer ? "flex aspect-square max-h-[min(52vw,220px)] w-full items-center justify-center p-2" : "mx-auto flex max-h-52 w-full items-center justify-center bg-white p-1"}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={videoUrl}
            alt={`${title} form demo`}
            loading="lazy"
            decoding="async"
            className={isPlayer ? "max-h-full max-w-full object-contain" : "max-h-48 w-auto max-w-full object-contain"}
          />
        </div>
        {isPlayer ? (
          <MuscleTags primary={primary} muscles={secondary} />
        ) : (
          <>
            <MuscleTags primary={primary} muscles={secondary} />
            {attribution ? (
              <p className="border-t border-line px-3 py-2 text-[10px] leading-snug text-faint">{attribution}</p>
            ) : null}
          </>
        )}
      </div>
    );
  }

  if (!playing && isHeavyVideo(videoUrl, videoSource)) {
    return (
      <button
        type="button"
        onClick={() => setPlaying(true)}
        className="flex aspect-video w-full items-center justify-center rounded-2xl border border-line bg-elevated/80 text-sm font-semibold text-fg"
        aria-label={`Play ${title} form video`}
      >
        Play form video
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-elevated">
      <video className="aspect-video w-full object-contain" controls playsInline preload="none" title={title}>
        <source src={videoUrl} type="video/quicktime" />
        <source src={videoUrl} />
      </video>
    </div>
  );
}
