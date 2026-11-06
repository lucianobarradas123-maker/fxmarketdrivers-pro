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

const VOL_LABEL = { baixa: "Baixa", normal: "Normal", elevada: "Elevada" } as const;

export function StatCards({ d }: { d: D }) {
  const volIdx = { baixa: 0, normal: 1, elevada: 2 }[d.marketVol.level];
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
      <Stat label={<Label>Maior divergência macro</Label>} note={`Técnica: ${d.widest.trend} · ${d.widest.alignment.toLowerCase()}`}>
        <p className="flex items-baseline gap-2.5">
          <span className="num text-[28px] font-semibold">{d.widest.pair}</span>
          <span className="num text-ink-2">{decimal(Math.abs(d.widest.divergence))}</span>
        </p>
      </Stat>
      <Stat
        label={<Label>Volatilidade do mercado</Label>}
        note={`ATR médio ${signed(d.marketVol.changePct, 0)}% vs. média de 20 dias`}
      >
        <p className={`text-[28px] font-semibold tracking-tight ${d.marketVol.level === "elevada" ? "text-down-soft" : "text-ink"}`}>
          {VOL_LABEL[d.marketVol.level]}
        </p>
        <div className="grid grid-cols-3 gap-1" role="img" aria-label={`Nível ${VOL_LABEL[d.marketVol.level]} numa escala baixa, normal, elevada`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={`h-1.5 rounded-full ${i === volIdx ? (i === 2 ? "bg-down-soft" : "bg-ink-2") : "bg-line-strong"}`} />
          ))}
        </div>
      </Stat>
    </section>
  );
}
