import { SITE } from "@/config/site";
import { getSessionUser } from "@/lib/auth/profile";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="app-canvas flex min-h-dvh flex-col">
      <main className="page-enter relative z-[1] mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-12 sm:px-8">
        <h1 className="font-display text-[2.5rem] font-bold leading-[1.08] tracking-[-0.03em] text-balance text-fg sm:text-[2.85rem]">
          {SITE.name}
        </h1>
        <p className="type-body mt-5 text-[1.125rem] font-semibold text-muted">Log every set. Progress every week.</p>
        <p className="type-body mt-4 max-w-[36ch]">{SITE.description}</p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/login"
            className="btn type-cta glass-btn-primary inline-flex items-center justify-center rounded-2xl px-6 py-3.5 text-center transition-[background-color] duration-[var(--m-out)] hover:bg-white/55"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="btn type-cta glass surface-sm inline-flex items-center justify-center px-6 py-3.5 text-center text-fg"
          >
            Create account
          </Link>
        </div>
        <p className="type-caption mt-12 max-w-[42ch]">
          Install on your phone: open in Safari or Chrome, then Add to Home Screen for a full-screen gym log.
        </p>
      </main>
    </div>
  );
}
