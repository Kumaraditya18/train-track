import { startWorkout } from "@/app/actions/workouts";
import { Button } from "@/components/ui/Button";
import { MemberPageHeader } from "@/components/ui/MemberPageHeader";
import { loadMemberDashboard } from "@/lib/data/member-dashboard";
import { requireProfile } from "@/lib/auth/profile";
import Link from "next/link";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const { dateLine, isRestDay, dailyRoutine, recentSessions, hints } = await loadMemberDashboard(profile.id);

  return (
    <div className="member-stack">
      <MemberPageHeader title="Home" description={dateLine} />

      {isRestDay ? (
        <section className="surface rounded-2xl p-5">
          <h2 className="type-card-title">Rest day</h2>
          <p className="type-body mt-2">
            Sunday in IST — recover, walk, or pick any session from Train when you are ready.
          </p>
          <Link
            href="/workout"
            className="type-body-strong mt-4 inline-block text-soft underline-offset-2 hover:text-fg hover:underline"
          >
            Browse routines
          </Link>
        </section>
      ) : dailyRoutine ? (
        <section className="surface rounded-2xl p-5">
          <h2 className="type-card-title">{dailyRoutine.name}</h2>
          {dailyRoutine.description ? (
            <p className="type-body mt-2 line-clamp-2">{dailyRoutine.description}</p>
          ) : null}
          <form action={startWorkout} className="mt-5">
            <input type="hidden" name="routine_id" value={dailyRoutine.id} />
            <Button type="submit" className="w-full py-3">
              Start workout
            </Button>
          </form>
        </section>
      ) : (
        <p className="type-caption">No routine matched today&apos;s split day in IST.</p>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between gap-2">
          <h2 className="type-section">Overload</h2>
          <Link href="/progress" className="type-caption text-muted hover:text-fg">
            Progress →
          </Link>
        </div>
        <ul className="space-y-2">
          {hints.length === 0 ? (
            <li className="surface type-caption rounded-xl px-4 py-3">
              Log sets to see weekly targets.
            </li>
          ) : (
            hints.slice(0, 4).map((hint) => (
              <li key={hint.exerciseId} className="surface rounded-xl px-4 py-3">
                <p className="type-body-strong">{hint.exerciseName}</p>
                <p className="type-caption mt-1 text-soft">{hint.suggestion}</p>
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-2">
          <h2 className="type-section">Recent</h2>
          <Link href="/workout" className="type-caption text-muted hover:text-fg">
            All routines →
          </Link>
        </div>
        <ul className="surface divide-y divide-line overflow-hidden rounded-2xl">
          {recentSessions.length === 0 ? (
            <li className="type-caption p-4">No workouts yet.</li>
          ) : (
            recentSessions.slice(0, 5).map((session) => (
              <li key={session.id}>
                <Link
                  href={`/workout/${session.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-elevated/80"
                >
                  <span className="type-body-strong min-w-0 truncate">{session.title}</span>
                  <span className="type-caption shrink-0">
                    {session.finished_at ? "Done" : "Live"}
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
