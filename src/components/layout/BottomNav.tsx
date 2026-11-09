"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { NAV_ITEMS, isActive } from "./nav-items";

/** Barra de navegação inferior — só no telemóvel. */
export function BottomNav() {
  return <BottomNavView pathname={usePathname()} />;
}

export function BottomNavView({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Navegação"
      className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-bar/95 px-1 pt-1.5 pb-[max(env(safe-area-inset-bottom),12px)] backdrop-blur md:hidden"
    >
      {NAV_ITEMS.filter((i) => i.mobile).map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 flex-col items-center justify-center gap-0.5 text-[11px] ${
              active ? "font-semibold text-up-soft" : "text-muted"
            }`}
          >
            <Icon name={item.icon} />
            {item.short}
          </Link>
        );
      })}
    </nav>
  );
}
