"use client";

import { fetchExerciseInstructions } from "@/app/actions/exercises";
import { ExerciseVideo } from "@/components/workout/ExerciseVideo";
import { useState } from "react";

export function ExerciseGuidePanel({
  exerciseId,
  exerciseName,
  instructions: initialInstructions,
  videoUrl,
  videoSource,
  videoAttribution,
  focusMuscles,
  muscleGroup,
  compact = false,
}: {
  exerciseId?: string;
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
  const [instructions, setInstructions] = useState(initialInstructions);
  const [loadingCues, setLoadingCues] = useState(false);
  const text = instructions?.trim();
  const canLoadCues = Boolean(exerciseId) && !text;

  async function toggleGuide() {
    if (!openGuide && canLoadCues && exerciseId) {
      setLoadingCues(true);
      const res = await fetchExerciseInstructions(exerciseId);
      setLoadingCues(false);
      if (res.data) setInstructions(res.data);
    }
    setOpenGuide((v) => !v);
  }

  if (!text && !videoUrl && !canLoadCues) return null;

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

      {text || canLoadCues ? (
        <div className="text-center">
          <button
            type="button"
            onClick={() => void toggleGuide()}
            disabled={loadingCues}
            className="text-xs font-medium text-muted underline-offset-2 hover:text-accent hover:underline disabled:opacity-50"
          >
            {loadingCues ? "Loading cues…" : openGuide ? "Hide cues" : "Coach cues"}
          </button>
          {openGuide && text ? (
            <p className="mt-2 text-left text-sm leading-relaxed text-muted whitespace-pre-wrap">{text}</p>
          ) : null}
          {openGuide && !text && !loadingCues ? (
            <p className="mt-2 text-left text-sm text-faint">No written cues for this move yet.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
