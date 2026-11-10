"use client";

import { removeExerciseFromSession } from "@/app/actions/session-exercises";
import { ExerciseGuidePanel } from "@/components/workout/ExerciseGuidePanel";
import { ExerciseLibrarySheet } from "@/components/workout/ExerciseLibrarySheet";
import { SetLogForm } from "@/components/workout/SetLogForm";
import { Button } from "@/components/ui/Button";
import { IconCheck, IconChevronDown } from "@/components/ui/icons";
import { useEffect, useMemo, useState, useTransition } from "react";

export type WorkoutExercise = {
  id: string;
  name: string;
  muscle_group: string | null;
  instructions: string | null;
  video_url?: string | null;
  video_source?: string | null;
  video_attribution?: string | null;
  focus_muscles?: string[] | null;
  target_sets: number;
  rep_floor: number;
  isPlanned: boolean;
};

type CatalogExercise = {
  id: string;
  name: string;
  muscle_group: string | null;
};

function defaultActiveId(
  exercises: WorkoutExercise[],
  nextSetByExercise: Record<string, number>,
): string | null {
  if (exercises.length === 0) return null;
  const planned = exercises.filter((e) => e.isPlanned);
  const pool = planned.length > 0 ? planned : exercises;
  const inProgress = pool.find((ex) => {
    const next = nextSetByExercise[ex.id] ?? 1;
    return next <= ex.target_sets;
  });
  return inProgress?.id ?? pool[0]?.id ?? null;
}

export function WorkoutSessionView({
  sessionId,
  finished,
  isRoutineSession,
  exercises,
  catalog,
  nextSetByExercise,
}: {
  sessionId: string;
  finished: boolean;
  isRoutineSession: boolean;
  exercises: WorkoutExercise[];
  catalog: CatalogExercise[];
  nextSetByExercise: Record<string, number>;
}) {
  const [activeId, setActiveId] = useState<string | null>(() =>
    defaultActiveId(exercises, nextSetByExercise),
  );
  const [queueOpen, setQueueOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [extraSetsById, setExtraSetsById] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setActiveId((prev) => {
      if (prev && exercises.some((e) => e.id === prev)) return prev;
      return defaultActiveId(exercises, nextSetByExercise);
    });
  }, [exercises, nextSetByExercise]);

  const currentIndex = exercises.findIndex((e) => e.id === activeId);
  const current = currentIndex >= 0 ? exercises[currentIndex] : exercises[0];
  const inSessionIds = useMemo(() => new Set(exercises.map((e) => e.id)), [exercises]);

  const prev = currentIndex > 0 ? exercises[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < exercises.length - 1 ? exercises[currentIndex + 1] : null;

  const queue = useMemo(() => {
    if (currentIndex < 0) return exercises;
    return exercises.slice(currentIndex + 1);
  }, [exercises, currentIndex]);

  const nextSet = current ? (nextSetByExercise[current.id] ?? 1) : 1;
  const extraSets = current ? (extraSetsById[current.id] ?? 0) : 0;
  const plannedSets = current ? current.target_sets + extraSets : 0;
  const pastPlan = current ? nextSet > plannedSets : false;

  function goTo(id: string) {
    setActiveId(id);
    setQueueOpen(false);
  }

  if (exercises.length === 0) {
    return (
      <>
        <EmptyFallback finished={finished} isRoutineSession={isRoutineSession} onBrowse={() => setShowAdd(true)} />
        {showAdd && !finished ? (
          <ExerciseLibrarySheet
            sessionId={sessionId}
            catalog={catalog}
            inSessionIds={inSessionIds}
            isRoutineSession={isRoutineSession}
            onClose={() => setShowAdd(false)}
            onAdded={setActiveId}
          />
        ) : null}
      </>
    );
  }

  return (
    <div className="workout-player">
      <ExerciseNav
        index={currentIndex}
        total={exercises.length}
        prev={prev}
        next={next}
        onPrev={() => prev && goTo(prev.id)}
        onNext={() => next && goTo(next.id)}
        disabled={finished}
      />

      {current ? (
        <article className="now-card surface rounded-[1.5rem] p-4">
          <header className="mb-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-muted">
                {current.isPlanned ? "Planned" : "Extra"}
                {current.muscle_group ? ` · ${current.muscle_group}` : ""}
                <span className="text-faint"> · aim {current.rep_floor}+ reps</span>
              </p>
              <h2 className="type-card-title text-[1.125rem]">{current.name}</h2>
            </div>
            {!finished ? (
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="shrink-0 rounded-lg border border-line bg-elevated px-2.5 py-1.5 text-xs font-semibold text-soft"
              >
                + Add
              </button>
            ) : null}
          </header>

          <ExerciseGuidePanel
            compact
            exerciseName={current.name}
            instructions={current.instructions}
            videoUrl={current.video_url}
            videoSource={current.video_source}
            videoAttribution={current.video_attribution}
            focusMuscles={current.focus_muscles}
            muscleGroup={current.muscle_group}
          />

          <SetProgress current={nextSet} planned={plannedSets} baseTarget={current.target_sets} />

          {!finished ? (
            <>
              <SetLogForm sessionId={sessionId} exerciseId={current.id} nextSetIndex={nextSet} pastTarget={pastPlan} />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  className="text-xs font-medium text-muted underline-offset-2 hover:text-fg hover:underline"
                  onClick={() =>
                    setExtraSetsById((m) => ({
                      ...m,
                      [current.id]: (m[current.id] ?? 0) + 1,
                    }))
                  }
                >
                  + Add planned set ({plannedSets + 1} total)
                </button>
                {next ? (
                  <button
                    type="button"
                    onClick={() => goTo(next.id)}
                    className="text-xs font-semibold text-soft"
                  >
                    Next exercise →
                  </button>
                ) : null}
              </div>
            </>
          ) : null}

          {!finished && !current.isPlanned ? (
            <Button
              type="button"
              variant="ghost"
              className="mt-3 w-full text-danger"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await removeExerciseFromSession(sessionId, current.id);
                  if (result.error) setError(result.error);
                })
              }
            >
              Remove add-on
            </Button>
          ) : null}
        </article>
      ) : null}

      {queue.length > 0 && !finished ? (
        <section className="queue-section" aria-label="Later in this workout">
          <button
            type="button"
            onClick={() => setQueueOpen((o) => !o)}
            className="queue-peek surface-sm flex w-full items-center gap-3 px-3 py-2.5 text-left"
            aria-expanded={queueOpen}
          >
            <span
              className={`queue-chevron flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line text-muted ${
                queueOpen ? "queue-chevron-open" : ""
              }`}
              aria-hidden
            >
              <IconChevronDown />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-medium text-faint">Later in workout</span>
              <span className="block truncate text-sm text-fg">
                {queueOpen ? `${queue.length} remaining` : queue[0]?.name}
              </span>
            </span>
            {!queueOpen && queue.length > 1 ? (
              <span className="shrink-0 text-xs tabular-nums text-muted">+{queue.length - 1}</span>
            ) : null}
          </button>

          <div className={`queue-drawer ${queueOpen ? "queue-drawer-open" : ""}`}>
            <div className="min-h-0 overflow-hidden">
              <ul className="queue-list mt-1 space-y-0.5 border-t border-line pt-2">
                {exercises.map((exercise, i) => {
                  const isCurrent = exercise.id === current?.id;
                  const nextS = nextSetByExercise[exercise.id] ?? 1;
                  const extra = extraSetsById[exercise.id] ?? 0;
                  const plan = exercise.target_sets + extra;
                  return (
                    <li key={exercise.id}>
                      <button
                        type="button"
                        onClick={() => goTo(exercise.id)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${
                          isCurrent ? "bg-elevated text-fg" : "text-muted hover:bg-elevated hover:text-fg"
                        }`}
                      >
                        <span className="tabular-nums w-5 text-center text-xs text-faint">{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate">{exercise.name}</span>
                        <span className="flex shrink-0 items-center gap-0.5 text-[10px] tabular-nums text-faint">
                          {nextS > plan ? (
                            <IconCheck className="text-soft" />
                          ) : (
                            `${nextS}/${plan}`
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {showAdd && !finished ? (
        <ExerciseLibrarySheet
          sessionId={sessionId}
          catalog={catalog}
          inSessionIds={inSessionIds}
          isRoutineSession={isRoutineSession}
          onClose={() => setShowAdd(false)}
          onAdded={setActiveId}
        />
      ) : null}
    </div>
  );
}

function ExerciseNav({
  index,
  total,
  prev,
  next,
  onPrev,
  onNext,
  disabled,
}: {
  index: number;
  total: number;
  prev: WorkoutExercise | null;
  next: WorkoutExercise | null;
  onPrev: () => void;
  onNext: () => void;
  disabled: boolean;
}) {
  return (
    <nav className="exercise-nav flex items-stretch gap-2" aria-label="Exercise navigation">
      <button
        type="button"
        disabled={disabled || !prev}
        onClick={onPrev}
        className="surface-sm flex min-h-11 flex-1 items-center justify-center gap-1 px-2 text-sm font-semibold text-fg disabled:opacity-35"
      >
        ← Previous
      </button>
      <span className="flex min-w-[4.5rem] flex-col items-center justify-center rounded-xl border border-line/80 px-2 text-center">
        <span className="text-[10px] text-faint">Move</span>
        <span className="text-sm font-semibold tabular-nums text-fg">
          {index + 1}/{total}
        </span>
      </span>
      <button
        type="button"
        disabled={disabled || !next}
        onClick={onNext}
        className="surface-sm flex min-h-11 flex-1 items-center justify-center gap-1 px-2 text-sm font-semibold text-fg disabled:opacity-35"
      >
        Next →
      </button>
    </nav>
  );
}

function SetProgress({
  current,
  planned,
  baseTarget,
}: {
  current: number;
  planned: number;
  baseTarget: number;
}) {
  const bars = Math.max(planned, current);
  return (
    <div className="mt-4 mb-2">
      <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
        <span>
          Set {current}
          {current > planned ? " (extra)" : ` of ${planned}`}
        </span>
        {planned > baseTarget ? (
          <span className="text-faint">Plan {baseTarget} + {planned - baseTarget} added</span>
        ) : (
          <span className="text-faint">Target {baseTarget} sets</span>
        )}
      </div>
      <div className="flex gap-1">
        {Array.from({ length: bars }, (_, i) => {
          const slot = i + 1;
          const isPlanned = slot <= planned;
          const filled = slot < current;
          const active = slot === current;
          return (
            <span
              key={slot}
              className={`h-1.5 flex-1 rounded-full ${
                filled ? "bg-fg/25" : active ? "bg-fg/40" : isPlanned ? "bg-line-strong" : "bg-line/60"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

function EmptyFallback({
  finished,
  isRoutineSession,
  onBrowse,
}: {
  finished: boolean;
  isRoutineSession: boolean;
  onBrowse: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line p-6 text-center">
      <p className="text-sm text-muted">
        {isRoutineSession ? "No moves in this session yet." : "Start by adding your first exercise."}
      </p>
      {!finished ? (
        <Button type="button" className="mt-4" onClick={onBrowse}>
          Browse library
        </Button>
      ) : null}
    </div>
  );
}
