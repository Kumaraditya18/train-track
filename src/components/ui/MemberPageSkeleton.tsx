export function MemberPageSkeleton() {
  return (
    <div className="member-stack animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-36 rounded-xl bg-elevated" />
        <div className="h-4 w-56 rounded-lg bg-elevated/70" />
      </div>
      <div className="surface h-40 rounded-2xl" />
      <div className="space-y-2">
        <div className="h-5 w-28 rounded-lg bg-elevated" />
        <div className="surface h-16 rounded-xl" />
        <div className="surface h-16 rounded-xl" />
      </div>
    </div>
  );
}
