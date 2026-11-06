export interface NavItem {
  href: string;
  label: string;
  short: string;
  icon: "grid" | "globe" | "calendar" | "shield" | "book" | "pairs";
  mobile: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Visão geral", short: "Visão", icon: "grid", mobile: true },
  { href: "/macro", label: "Macro", short: "Macro", icon: "globe", mobile: true },
  { href: "/calendario", label: "Calendário", short: "Calendário", icon: "calendar", mobile: true },
  { href: "/pre-operacao", label: "Pré-operação", short: "Risco", icon: "shield", mobile: true },
  { href: "/diario", label: "Diário", short: "Diário", icon: "book", mobile: true },
  { href: "/pares", label: "Pares", short: "Pares", icon: "pairs", mobile: false },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
