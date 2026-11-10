"use client";

import { ExerciseVideo } from "@/components/workout/ExerciseVideo";
import { useState } from "react";

export function ExerciseGuidePanel({
  exerciseName,
  instructions,
  videoUrl,
  videoSource,
  videoAttribution,
  focusMuscles,
  muscleGroup,
  compact = false,
}: {
  exerciseName: string;
  instructions: string | null;
  videoUrl?: string | null;
  videoSource?: string | null;
  videoAttribution?: string | null;
  focusMuscles?: string[] | null;
  muscleGroup?: string | null;
  compact?: boolean;
}) {
  const [openGuide, setOpenGuide] = useState(false);
  const text = instructions?.trim();

  if (!text && !videoUrl) return null;

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {videoUrl ? (
        <ExerciseVideo
          videoUrl={videoUrl}
          videoSource={videoSource}
          attribution={compact ? null : videoAttribution}
          title={exerciseName}
          focusMuscles={focusMuscles}
          muscleGroup={muscleGroup}
          variant={compact ? "player" : "default"}
        />
      ) : null}

      {text ? (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setOpenGuide((v) => !v)}
            className="text-xs font-medium text-muted underline-offset-2 hover:text-accent hover:underline"
          >
            {openGuide ? "Hide cues" : "Coach cues"}
          </button>
          {openGuide ? (
            <p className="mt-2 text-left text-sm leading-relaxed text-muted whitespace-pre-wrap">{text}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
