import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { decimal, euros, signed } from "@/lib/format";
import { Suspense } from "react";
import { getUpcoming } from "@/lib/events";
import { dayKey, formatTime, TZ } from "@/lib/time";
import { getSettings, getTrades } from "@/lib/journal-data";
import { RELIABLE_SAMPLE } from "@/lib/journal";

const IMPACT_STYLE = { alto: "text-down", médio: "text-ink", baixo: "text-faint" } as const;

function eventWhen(iso: string, now: number) {
  const sameDay = dayKey(iso) === dayKey(new Date(now).toISOString());
  if (sameDay) return formatTime(iso);
  const day = new Intl.DateTimeFormat("pt-PT", { weekday: "short", timeZone: TZ }).format(new Date(iso)).replace(".", "");
  return `${day} ${formatTime(iso)}`;
}

async function EventsList() {
  const { now, events } = await getUpcoming(7);
  if (events.length === 0) {
    return <p className="border-t border-line-soft py-3 text-[13px] text-muted">Sem eventos registados para os próximos 7 dias.</p>;
  }
  return (
    <ul aria-labelledby="cal">
      {events.slice(0, 6).map((e) => (
        <li key={e.id} className="flex items-center gap-3 border-t border-line-soft py-2">
          <span className="num w-[72px] text-[13px] text-muted">{eventWhen(e.data_hora, now)}</span>
          <span className="num w-9 text-[13px] font-semibold">{e.moeda}</span>
          <span className="min-w-0 flex-auto">{e.nome}</span>
          <span className={`text-[11px] font-semibold uppercase ${IMPACT_STYLE[e.impacto]}`}>{e.impacto}</span>
        </li>
      ))}
    </ul>
  );
}

export function EventsCard() {
  return (
    <Card className="flex flex-col gap-2.5">
      <CardHeader id="cal" title="Próximos eventos" tag="informacao" />
      <Suspense fallback={<p className="text-[13px] text-muted">A carregar…</p>}>
        <EventsList />
      </Suspense>
      <Link href="/calendario" className="text-[13px] text-up-soft hover:text-ink">
        Ver calendário completo
      </Link>
    </Card>
  );
}

export async function JournalCard() {
  const { now, trades } = await getTrades(200);
  const weekAgo = now - 7 * 864e5;
  const week = trades.filter((t) => new Date(t.aberta_em).getTime() >= weekAgo);
  const closedWeek = trades.filter((t) => t.estado === "fechada" && t.fechada_em && new Date(t.fechada_em).getTime() >= weekAgo);
  const weekR = closedWeek.reduce((s, t) => s + (t.resultado_r ?? 0), 0);
  const followed = closedWeek.filter((t) => t.seguiu_plano).length;
  const totalClosed = trades.filter((t) => t.estado === "fechada").length;
  const progress = Math.min(100, (totalClosed / RELIABLE_SAMPLE) * 100);
  const open = trades.filter((t) => t.estado === "aberta").length;
  return (
    <Card className="flex flex-col gap-3">
      <CardHeader
        id="diario-semana"
        title="Diário · últimos 7 dias"
        help="O “R” mede o resultado em múltiplos do risco. +1R = ganhaste o que arriscaste; −1R = perdeste o que arriscaste. Permite comparar operações com tamanhos diferentes."
      />
      <dl className="grid grid-cols-3 gap-2.5">
        <div className="flex flex-col-reverse">
          <dt className="text-xs text-muted">registadas{open ? ` · ${open} abertas` : ""}</dt>
          <dd className="num text-[22px] font-semibold">{week.length}</dd>
        </div>
        <div className="flex flex-col-reverse">
          <dt className="text-xs text-muted">resultado</dt>
          <dd className={`num text-[22px] font-semibold ${weekR > 0 ? "text-up" : weekR < 0 ? "text-down" : ""}`}>{closedWeek.length ? `${signed(weekR)}R` : "—"}</dd>
        </div>
        <div className="flex flex-col-reverse">
          <dt className="text-xs text-muted">seguiu o plano</dt>
          <dd className="num text-[22px] font-semibold">{closedWeek.length ? `${followed}/${closedWeek.length}` : "—"}</dd>
        </div>
      </dl>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs text-muted">
          <span>Amostra para conclusões fiáveis</span>
          <span className="num">
            {totalClosed} / {RELIABLE_SAMPLE}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-line-soft" role="progressbar" aria-valuenow={totalClosed} aria-valuemin={0} aria-valuemax={RELIABLE_SAMPLE} aria-label="Operações fechadas">
          <div className="h-1.5 rounded-full bg-up" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <Link
        href="/diario"
        className="mt-auto inline-flex min-h-11 items-center self-start rounded-lg bg-up px-4 font-semibold text-bg transition-opacity hover:opacity-90"
      >
        Abrir diário
      </Link>
    </Card>
  );
}

export async function RiskCard() {
  const settings = await getSettings();
  return (
    <Card className="flex flex-col gap-3">
      <CardHeader id="risco" title="Risco por operação" />
      {settings ? (
        <>
          <p className="flex items-baseline gap-2.5">
            <span className="num text-[28px] font-semibold">{euros((settings.saldo * settings.risco_pct) / 100)}</span>
            <span className="text-muted">
              {decimal(settings.risco_pct, 1)}% de {euros(settings.saldo)}
            </span>
          </p>
          <p className="text-[13px] text-ink-2">O teu limite definido. A pré-operação converte isto em lotes a partir do stop em pips.</p>
        </>
      ) : (
        <p className="text-[13px] text-down-soft">Ainda não definiste o saldo da conta. Faz isso no Diário → Definições da conta.</p>
      )}
      <Link
        href="/pre-operacao"
        className="mt-auto inline-flex min-h-11 items-center self-start rounded-lg border border-line-strong px-4 font-semibold text-ink transition-colors hover:bg-surface-2"
      >
        Abrir pré-operação
      </Link>
    </Card>
  );
}
