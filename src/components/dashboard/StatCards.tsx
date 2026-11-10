import Link from "next/link";
import { Suspense } from "react";
import { Label } from "@/components/ui/Card";
import { Countdown } from "@/components/ui/Countdown";
import { getUpcoming } from "@/lib/events";
import { formatTime } from "@/lib/time";
import { decimal, signed } from "@/lib/format";
import type { getDashboard } from "@/lib/dashboard";

type D = ReturnType<typeof getDashboard>;

function Stat({ label, children, note }: { label: React.ReactNode; children: React.ReactNode; note: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-line bg-surface p-[18px]">
      {label}
      {children}
      <p className="text-xs text-muted">{note}</p>
    </div>
  );
}

async function NextEventStat({ pairs }: { pairs: string[] }) {
  const { now, events } = await getUpcoming(14, "alto");
  const next = events[0];
  const label = (
    <div className="flex items-center justify-between">
      <Label>Próximo evento · alto impacto</Label>
      {next && <span className="size-2 rounded-full bg-down" aria-hidden="true" />}
    </div>
  );
  if (!next) {
    return (
      <Stat label={label} note="Regista os eventos da semana no calendário.">
        <Link href="/calendario" className="text-[15px] font-semibold text-up-soft hover:text-ink">
          Sem eventos registados
        </Link>
      </Stat>
    );
  }
  const affected = pairs.filter((p) => p.includes(next.moeda)).length;
  return (
    <Stat label={label} note={`${formatTime(next.data_hora)} Lisboa · afeta ${affected} pares da tua lista`}>
      <p className="text-lg font-semibold">
        {next.moeda} · {next.nome}
      </p>
      <Countdown to={next.data_hora} initialNow={now} className="num text-[28px] font-semibold tracking-tight text-down" />
    </Stat>
  );
}

export function favoredBy(index: number): string {
  if (index < 45) return "favorece refúgios: JPY, CHF, USD";
  if (index > 55) return "favorece moedas de risco: AUD, NZD, CAD";
  return "sem efeito relevante nas moedas";
}

function RiskStat({ risk }: { risk: D["risk"] }) {
  if (!risk) {
    return (
      <Stat label={<Label>Sentimento de risco</Label>} note="Fonte indisponível de momento; a força das moedas ignora este componente.">
        <p className="text-[28px] font-semibold tracking-tight text-muted">—</p>
      </Stat>
    );
  }
  const vix = risk.components.find((c) => c.key === "vix")!;
  const color = risk.index < 45 ? "text-down-soft" : risk.index > 55 ? "text-up-soft" : "text-ink";
  const bar = risk.index < 45 ? "bg-down" : risk.index > 55 ? "bg-up" : "bg-ink-2";
  return (
    <Stat label={<Label>Sentimento de risco</Label>} note={`VIX ${decimal(vix.value, 1)} · ${favoredBy(risk.index)}`}>
      <p className="flex items-baseline gap-2.5">
        <span className={`text-[28px] font-semibold tracking-tight ${color}`}>{risk.label}</span>
        <span className="num text-ink-2">{risk.index}</span>
      </p>
      <div
        className="relative h-1.5 rounded-full bg-line-strong"
        role="img"
        aria-label={`Índice ${risk.index} numa escala de 0 (medo extremo) a 100 (ganância extrema)`}
      >
        <div className={`h-1.5 rounded-full ${bar}`} style={{ width: `${risk.index}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-faint" aria-hidden="true">
        <span>Medo</span>
        <span>Ganância</span>
      </div>
    </Stat>
  );
}

export function StatCards({ d }: { d: D }) {
  return (
    <section aria-label="Resumo" className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
      <Suspense fallback={<Stat label={<Label>Próximo evento · alto impacto</Label>} note="A carregar…"><span /></Stat>}>
        <NextEventStat pairs={d.pairs.map((p) => p.pair)} />
      </Suspense>
      <Stat label={<Label>Moeda mais forte</Label>} note={`${d.strongest.bank} ${d.strongest.stance.toLowerCase()}`}>
        <p className="flex items-baseline gap-2.5">
          <span className="num text-[28px] font-semibold">{d.strongest.code}</span>
          <span className="num font-semibold text-up">{signed(d.strongest.total)}</span>
        </p>
      </Stat>
      <Stat label={<Label>Moeda mais fraca</Label>} note={`${d.weakest.bank} ${d.weakest.stance.toLowerCase()}`}>
        <p className="flex items-baseline gap-2.5">
          <span className="num text-[28px] font-semibold">{d.weakest.code}</span>
          <span className="num font-semibold text-down">{signed(d.weakest.total)}</span>
        </p>
      </Stat>
      <Stat label={<Label>Maior divergência macro</Label>} note={d.widest.trend && d.widest.alignment ? `Técnica: ${d.widest.trend} · ${d.widest.alignment.toLowerCase()}` : "Técnica indisponível de momento"}>
        <p className="flex items-baseline gap-2.5">
          <span className="num text-[28px] font-semibold">{d.widest.pair}</span>
          <span className="num text-ink-2">{decimal(Math.abs(d.widest.divergence))}</span>
        </p>
      </Stat>
      <RiskStat risk={d.risk} />
    </section>
  );
}
