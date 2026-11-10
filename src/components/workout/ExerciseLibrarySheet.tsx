"use client";

import { addExerciseToSession } from "@/app/actions/session-exercises";
import { Button } from "@/components/ui/Button";
import { useMemo, useState, useTransition } from "react";

type CatalogExercise = {
  id: string;
  name: string;
  muscle_group: string | null;
};

export function ExerciseLibrarySheet({
  sessionId,
  catalog,
  inSessionIds,
  isRoutineSession,
  onClose,
  onAdded,
}: {
  sessionId: string;
  catalog: CatalogExercise[];
  inSessionIds: Set<string>;
  isRoutineSession: boolean;
  onClose: () => void;
  onAdded: (exerciseId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<string | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const muscleGroups = useMemo(() => {
    const groups = new Set<string>();
    for (const ex of catalog) {
      if (ex.muscle_group) groups.add(ex.muscle_group);
    }
    return [...groups].sort();
  }, [catalog]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog
      .filter((ex) => !inSessionIds.has(ex.id))
      .filter((ex) => muscle === "all" || ex.muscle_group === muscle)
      .filter((ex) => !q || ex.name.toLowerCase().includes(q))
      .slice(0, 40);
  }, [catalog, inSessionIds, muscle, query]);

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
      <div className="sheet-panel glass-chrome relative z-10 w-full max-w-lg rounded-t-[1.75rem] p-4 sm:rounded-[1.75rem]">
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
        <ul className="max-h-56 space-y-0.5 overflow-y-auto overscroll-contain">
          {filtered.map((ex) => (
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
          ))}
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
