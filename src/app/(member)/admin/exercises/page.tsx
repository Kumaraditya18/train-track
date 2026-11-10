import { deleteExerciseForm, upsertExercise } from "@/app/actions/admin";
import { syncExerciseGifsForm } from "@/app/actions/sync-gifs";
import { Button } from "@/components/ui/Button";
import { Input, Label, TextArea } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/server";
import type { Exercise } from "@/lib/training/types";

export default async function AdminExercisesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercises")
    .select("id, name, muscle_group, instructions, video_url, video_attribution")
    .order("name");
  const exercises = (data as Exercise[]) ?? [];

  return (
    <div className="space-y-8 pb-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">Exercises</h1>
        <p className="mt-1 text-sm text-muted">
          Edit names, cues, and form GIF URLs (short loops — jsDelivr / ExerciseDB style).
        </p>
        <form action={syncExerciseGifsForm} className="mt-4">
          <Button type="submit" variant="secondary">
            Fix all exercise GIFs (DB sync)
          </Button>
        </form>
      </div>

      <form action={upsertExercise} className="panel space-y-4 p-5">
        <h2 className="font-semibold text-fg">Add exercise</h2>
        <div>
          <Label htmlFor="name-new">Name</Label>
          <Input id="name-new" name="name" required placeholder="Barbell bench press" />
        </div>
        <div>
          <Label htmlFor="muscle-new">Muscle group</Label>
          <Input id="muscle-new" name="muscle_group" placeholder="Chest" />
        </div>
        <div>
          <Label htmlFor="instructions-new">How to perform</Label>
          <TextArea id="instructions-new" name="instructions" rows={3} placeholder="Setup and cues" />
        </div>
        <div>
          <Label htmlFor="video-new">Form GIF URL</Label>
          <Input id="video-new" name="video_url" type="url" placeholder="https://cdn.jsdelivr.net/gh/…/exercise.gif" />
        </div>
        <div>
          <Label htmlFor="attrib-new">Video credit</Label>
          <Input id="attrib-new" name="video_attribution" placeholder="Author · license (wger.de)" />
        </div>
        <Button type="submit">Save</Button>
      </form>

      <ul className="space-y-4">
        {exercises.map((exercise) => (
          <li key={exercise.id} className="panel p-4">
            <form action={upsertExercise} className="space-y-3">
              <input type="hidden" name="id" value={exercise.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor={`name-${exercise.id}`}>Name</Label>
                  <Input id={`name-${exercise.id}`} name="name" defaultValue={exercise.name} required />
                </div>
                <div>
                  <Label htmlFor={`muscle-${exercise.id}`}>Muscle group</Label>
                  <Input
                    id={`muscle-${exercise.id}`}
                    name="muscle_group"
                    defaultValue={exercise.muscle_group ?? ""}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor={`inst-${exercise.id}`}>How to perform</Label>
                <TextArea
                  id={`inst-${exercise.id}`}
                  name="instructions"
                  rows={3}
                  defaultValue={exercise.instructions ?? ""}
                />
              </div>
              <div>
                <Label htmlFor={`vid-${exercise.id}`}>Form video URL</Label>
                <Input
                  id={`vid-${exercise.id}`}
                  name="video_url"
                  type="url"
                  defaultValue={exercise.video_url ?? ""}
                  placeholder="https://…"
                />
              </div>
              <div>
                <Label htmlFor={`attr-${exercise.id}`}>Video credit</Label>
                <Input
                  id={`attr-${exercise.id}`}
                  name="video_attribution"
                  defaultValue={exercise.video_attribution ?? ""}
                />
              </div>
              <Button type="submit" variant="secondary">
                Save changes
              </Button>
            </form>
            <form action={deleteExerciseForm} className="mt-3">
              <input type="hidden" name="id" value={exercise.id} />
              <Button type="submit" variant="danger">
                Delete
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
