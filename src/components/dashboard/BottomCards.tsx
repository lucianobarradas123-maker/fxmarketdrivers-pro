import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { euros, signed } from "@/lib/format";
import type { EconomicEvent } from "@/lib/data/types";
import { SAMPLE_ACCOUNT, SAMPLE_JOURNAL } from "@/lib/data/sample";

const IMPACT_STYLE = { alto: "text-down", médio: "text-ink", baixo: "text-faint" } as const;

function eventTime(iso: string) {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("pt-PT", { weekday: "short", timeZone: "Europe/Lisbon" }).format(d);
  const time = new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Lisbon" }).format(d);
  const sameDay = d.toISOString().slice(0, 10) === "2026-11-06";
  return sameDay ? time : `${day.replace(".", "")} ${time}`;
}

export function EventsCard({ events }: { events: EconomicEvent[] }) {
  return (
    <Card className="flex flex-col gap-2.5">
      <CardHeader id="cal" title="Próximos eventos" tag="informacao" />
      <ul aria-labelledby="cal">
        {events.map((e) => (
          <li key={e.time + e.name} className="flex items-center gap-3 border-t border-line-soft py-2">
            <span className="num w-[72px] text-[13px] text-muted">{eventTime(e.time)}</span>
            <span className="num w-9 text-[13px] font-semibold">{e.currency}</span>
            <span className="min-w-0 flex-auto">{e.name}</span>
            <span className={`text-[11px] font-semibold uppercase ${IMPACT_STYLE[e.impact]}`}>{e.impact}</span>
          </li>
        ))}
      </ul>
      <Link href="/calendario" className="text-[13px] text-up-soft hover:text-ink">
        Ver calendário completo
      </Link>
    </Card>
  );
}

export function JournalCard() {
  const j = SAMPLE_JOURNAL;
  const progress = Math.min(100, (j.totalTrades / j.reliableSample) * 100);
  return (
    <Card className="flex flex-col gap-3">
      <CardHeader
        id="diario-semana"
        title="Diário · esta semana"
        help="O “R” mede o resultado em múltiplos do risco. +1R = ganhaste o que arriscaste; −1R = perdeste o que arriscaste. Permite comparar operações com tamanhos diferentes."
      />
      <dl className="grid grid-cols-3 gap-2.5">
        <div className="flex flex-col-reverse">
          <dt className="text-xs text-muted">operações</dt>
          <dd className="num text-[22px] font-semibold">{j.weekTrades}</dd>
        </div>
        <div className="flex flex-col-reverse">
          <dt className="text-xs text-muted">resultado</dt>
          <dd className={`num text-[22px] font-semibold ${j.weekR >= 0 ? "text-up" : "text-down"}`}>{signed(j.weekR)}R</dd>
        </div>
        <div className="flex flex-col-reverse">
          <dt className="text-xs text-muted">seguiu o plano</dt>
          <dd className="num text-[22px] font-semibold">
            {j.followedPlan}/{j.weekTrades}
          </dd>
        </div>
      </dl>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs text-muted">
          <span>Amostra para conclusões fiáveis</span>
          <span className="num">
            {j.totalTrades} / {j.reliableSample}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-line-soft" role="progressbar" aria-valuenow={j.totalTrades} aria-valuemin={0} aria-valuemax={j.reliableSample} aria-label="Operações registadas">
          <div className="h-1.5 rounded-full bg-up" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <Link
        href="/diario"
        className="mt-auto inline-flex min-h-11 items-center self-start rounded-lg bg-up px-4 font-semibold text-bg transition-opacity hover:opacity-90"
      >
        Registar operação
      </Link>
    </Card>
  );
}

export function RiskCard() {
  const { balance, riskPct } = SAMPLE_ACCOUNT;
  return (
    <Card className="flex flex-col gap-3">
      <CardHeader id="risco" title="Risco por operação" />
      <p className="flex items-baseline gap-2.5">
        <span className="num text-[28px] font-semibold">{euros((balance * riskPct) / 100)}</span>
        <span className="text-muted">
          {riskPct}% de {euros(balance)}
        </span>
      </p>
      <p className="text-[13px] text-ink-2">O teu limite definido. A calculadora converte isto em lotes a partir do stop em pips.</p>
      <Link
        href="/pre-operacao"
        className="mt-auto inline-flex min-h-11 items-center self-start rounded-lg border border-line-strong px-4 font-semibold text-ink transition-colors hover:bg-surface-2"
      >
        Abrir pré-operação
      </Link>
    </Card>
  );
}
