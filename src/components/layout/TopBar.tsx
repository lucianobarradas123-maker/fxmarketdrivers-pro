"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Icon";
import { DataStatus } from "@/components/ui/DataStatus";
import { NAV_ITEMS, isActive } from "./nav-items";
import { MACRO_META } from "@/lib/macro/meta";

export function TopBar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bar/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-7 gap-y-3 px-4 py-3 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 text-ink no-underline">
          <Logo />
          <span className="text-base font-bold tracking-tight">FX Market Drivers</span>
          <span className="num rounded border border-up-line px-1.5 text-[11px] font-semibold text-up-soft">PRO</span>
        </Link>
        <nav aria-label="Navegação principal" className="hidden flex-wrap gap-0.5 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  active ? "bg-surface-2 font-semibold text-ink" : "text-ink-2 hover:bg-surface hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex-1" />
        <DataStatus meta={MACRO_META} prefix="Macro: OCDE" />
        <Link
          href="/conta"
          aria-label="Conta e segurança"
          aria-current={pathname === "/conta" ? "page" : undefined}
          className={`grid size-11 place-items-center rounded-full border transition-colors ${
            pathname === "/conta" ? "border-up-line text-up-soft" : "border-line text-ink-2 hover:text-ink"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <circle cx="10" cy="7" r="3.5" />
            <path d="M3.5 17c1.2-3 3.6-4.5 6.5-4.5s5.3 1.5 6.5 4.5" strokeLinecap="round" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
