import type { NavItem } from "@/components/layout/nav-items";

const PATHS: Record<NavItem["icon"], React.ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="6" height="6" rx="1.5" />
      <rect x="11" y="3" width="6" height="6" rx="1.5" />
      <rect x="3" y="11" width="6" height="6" rx="1.5" />
      <rect x="11" y="11" width="6" height="6" rx="1.5" />
    </>
  ),
  globe: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M3 10h14M10 3c-3 3-3 11 0 14 3-3 3-11 0-14" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="14" height="13" rx="2" />
      <path d="M3 8h14M7 2v3M13 2v3" strokeLinecap="round" />
    </>
  ),
  shield: <path d="M10 2l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V5z" strokeLinejoin="round" />,
  book: <path d="M5 2h10v16H5zM8 6h4M8 10h4" strokeLinejoin="round" strokeLinecap="round" />,
  pairs: <path d="M4 7h11l-3-3M16 13H5l3 3" strokeLinecap="round" strokeLinejoin="round" />,
};

export function Icon({ name, size = 20 }: { name: NavItem["icon"]; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

export function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <circle cx="13" cy="13" r="11" stroke="var(--color-up)" strokeWidth="2" />
      <path d="M6 16l4.5-4.5L14 14.5l6-6" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
