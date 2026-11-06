"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Data de hoje, calculada no browser (a página é pré-gerada no servidor). */
export function Today() {
  const text = useSyncExternalStore(
    subscribe,
    () =>
      new Intl.DateTimeFormat("pt-PT", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Lisbon" }).format(new Date()),
    () => "",
  );
  return <span suppressHydrationWarning>{text ? text.charAt(0).toUpperCase() + text.slice(1) : " "}</span>;
}
