"use client";

import { addExerciseToSession } from "@/app/actions/session-exercises";
import { searchExerciseCatalog, type CatalogExercise } from "@/app/actions/exercises";
import { EXERCISE_MUSCLE_GROUPS } from "@/data/exercise-muscle-groups";
import { Button } from "@/components/ui/Button";
import { useEffect, useMemo, useState, useTransition } from "react";

export function ExerciseLibrarySheet({
  sessionId,
  inSessionIds,
  isRoutineSession,
  onClose,
  onAdded,
}: {
  sessionId: string;
  inSessionIds: Set<string>;
  isRoutineSession: boolean;
  onClose: () => void;
  onAdded: (exerciseId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<string | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<CatalogExercise[]>([]);
  const muscleGroups = EXERCISE_MUSCLE_GROUPS;

  const excludeIds = useMemo(() => [...inSessionIds], [inSessionIds]);

  useEffect(() => {
    let cancelled = false;
    const q = query.trim();
    const timer = window.setTimeout(
      async () => {
        setLoading(true);
        const res = await searchExerciseCatalog({
          query: q.length >= 2 ? q : undefined,
          muscle: muscle === "all" ? undefined : muscle,
          excludeIds,
          limit: 40,
        });
        if (!cancelled) {
          setResults(res.data);
          if (res.error) setError(res.error);
          setLoading(false);
        }
      },
      q.length >= 2 ? 280 : 0,
    );
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, muscle, excludeIds]);

  function onAdd(exerciseId: string) {
    setError(null);
    startTransition(async () => {
      const result = await addExerciseToSession(sessionId, exerciseId);
      if (result.error) setError(result.error);
      else {
        onAdded(exerciseId);
        onClose();
      }
    });
  }

  return (
    <div className="sheet-backdrop fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button type="button" className="sheet-scrim absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="sheet-panel relative z-10 w-full max-w-lg rounded-t-[1.75rem] p-4 sm:rounded-[1.75rem]">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="type-section">Add exercise</h2>
          <Button type="button" variant="ghost" className="px-2" onClick={onClose}>
            Done
          </Button>
        </div>
        <p className="mb-3 text-xs text-muted">
          {isRoutineSession ? "Adds to the end of today’s queue." : "Search moves with form GIFs."}
        </p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="field-input mb-3 w-full"
          autoComplete="off"
        />
        <div className="mb-3 flex gap-2 overflow-x-auto pb-0.5">
          <Chip active={muscle === "all"} onClick={() => setMuscle("all")} label="All" />
          {muscleGroups.map((g) => (
            <Chip key={g} active={muscle === g} onClick={() => setMuscle(g)} label={g} />
          ))}
        </div>
        <ul className="sheet-list max-h-56 space-y-0.5 overflow-y-auto overscroll-contain rounded-xl border border-line/80 p-1">
          {loading ? (
            <li className="px-3 py-6 text-center text-sm text-muted">Loading…</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted">No matches. Try another search.</li>
          ) : (
            results.map((ex) => (
              <li key={ex.id}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onAdd(ex.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-elevated"
                >
                  <span className="truncate font-medium text-fg">{ex.name}</span>
                  <span className="shrink-0 text-xs text-faint">{ex.muscle_group}</span>
                </button>
              </li>
            ))
          )}
        </ul>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      </div>
    </div>
  );
}

function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
        active ? "glass-pill text-fg" : "bg-elevated text-muted"
      }`}
    >
      {label}
    </button>
  );
}
