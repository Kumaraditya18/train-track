"use client";

import { IconChart, IconDumbbell, IconHome, IconShield } from "@/components/ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard", label: "Home", Icon: IconHome },
  { href: "/workout", label: "Train", Icon: IconDumbbell },
  { href: "/progress", label: "Progress", Icon: IconChart },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MemberNav({ showAdmin }: { showAdmin: boolean }) {
  const pathname = usePathname() ?? "/dashboard";

  return (
    <nav
      className="member-tabbar tab-dock glass-chrome px-1.5 py-1.5"
      aria-label="Main"
    >
      <div className="flex items-stretch justify-around gap-0.5">
        {tabs.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
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
            aria-current={pathname.startsWith("/admin") ? "page" : undefined}
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
