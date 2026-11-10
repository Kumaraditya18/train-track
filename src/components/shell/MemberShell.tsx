import { SITE } from "@/config/site";
import { signOut } from "@/app/actions/auth";
import { MemberNav } from "@/components/shell/MemberNav";
import type { ReactNode } from "react";

export function MemberShell({
  children,
  displayName,
  isAdmin,
}: {
  children: ReactNode;
  displayName: string;
  isAdmin: boolean;
}) {
  return (
    <div className="member-shell app-canvas mx-auto min-h-dvh w-full max-w-lg text-fg">
      <header className="glass-chrome member-header z-30 mx-3 mt-3 shrink-0 rounded-[1.25rem] px-1">
        <div className="flex items-center justify-between gap-3 px-3 py-3">
          <div className="min-w-0">
            <p className="type-brand truncate">{SITE.shortName}</p>
            <p className="type-caption truncate text-muted">Hi, {displayName}</p>
          </div>
          <form action={signOut} className="shrink-0">
            <button
              type="submit"
              className="type-body rounded-xl px-2.5 py-1.5 text-soft transition-colors hover:bg-white/70 hover:text-fg"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="member-main relative z-[1] min-h-0 min-w-0 flex-1 px-4 py-5 sm:px-5">{children}</main>

      <div
        className="z-40 shrink-0 px-3 pb-3"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <MemberNav showAdmin={isAdmin} />
      </div>
    </div>
  );
}
