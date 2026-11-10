import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-fg">Coach admin</h1>
        <p className="mt-1 text-sm text-muted">Manage exercises and routines for your athletes.</p>
      </div>
      <div className="grid gap-3">
        <Link href="/admin/exercises" className="panel panel-interactive block p-5">
          <p className="font-semibold text-fg">Exercises</p>
          <p className="mt-1 text-sm text-muted">Add or edit movement library</p>
        </Link>
        <Link href="/admin/routines" className="panel panel-interactive block p-5">
          <p className="font-semibold text-fg">Routines</p>
          <p className="mt-1 text-sm text-muted">Build daily recommendations and templates</p>
        </Link>
      </div>
    </div>
  );
}
