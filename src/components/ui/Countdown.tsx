"use client";

import { useEffect, useState } from "react";

function fmt(ms: number) {
  if (ms <= 0) return "a decorrer";
  const min = Math.floor(ms / 60000);
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  if (d > 0) return `${d}d ${h}h`;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Contagem decrescente que se atualiza a cada 30 segundos. */
export function Countdown({ to, initialNow, className }: { to: string; initialNow: number; className?: string }) {
  const [now, setNow] = useState(initialNow);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className={className} suppressHydrationWarning>
      {fmt(new Date(to).getTime() - now)}
    </span>
  );
}
