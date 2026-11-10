"use client";

import { IconChart, IconDumbbell, IconHome, IconShield } from "@/components/ui/icons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useTransition } from "react";

const tabs = [
  { href: "/dashboard", label: "Home", Icon: IconHome },
  { href: "/workout", label: "Train", Icon: IconDumbbell },
  { href: "/progress", label: "Progress", Icon: IconChart },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MemberNav({
  showAdmin,
  onPendingChange,
}: {
  showAdmin: boolean;
  onPendingChange?: (pending: boolean) => void;
}) {
  const pathname = usePathname() ?? "/dashboard";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  useEffect(() => {
    for (const { href } of tabs) {
      router.prefetch(href);
    }
    if (showAdmin) router.prefetch("/admin");
  }, [router, showAdmin]);

  const navigate = useCallback(
    (href: string) => {
      if (isActive(pathname, href)) return;
      startTransition(() => {
        router.push(href);
      });
    },
    [pathname, router],
  );

  return (
    <nav
      className="member-tabbar tab-dock glass-chrome px-1.5 py-1.5"
      aria-label="Main"
      data-pending={isPending ? "" : undefined}
    >
      <div className="flex items-stretch justify-around gap-0.5">
        {tabs.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              prefetch
              scroll={false}
              aria-current={active ? "page" : undefined}
              onClick={(e) => {
                if (active) return;
                e.preventDefault();
                navigate(href);
              }}
              className={`tab-link type-nav relative flex min-h-11 min-w-[4rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1 ${
                active ? "is-active glass-pill text-fg shadow-sm" : "text-muted"
              }`}
            >
              <Icon className="shrink-0" />
              <span className="leading-none">{label}</span>
            </Link>
          );
        })}
        {showAdmin ? (
          <Link
            href="/admin"
            prefetch
            scroll={false}
            aria-current={pathname.startsWith("/admin") ? "page" : undefined}
            onClick={(e) => {
              if (pathname.startsWith("/admin")) return;
              e.preventDefault();
              navigate("/admin");
            }}
            className={`tab-link type-nav relative flex min-h-11 min-w-[4rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1 ${
              pathname.startsWith("/admin") ? "is-active glass-pill text-fg shadow-sm" : "text-muted"
            }`}
          >
            <IconShield className="shrink-0" />
            <span className="leading-none">Admin</span>
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
