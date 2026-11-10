import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Card, CardHeader, Label } from "@/components/ui/Card";
import { Disclaimer, PageHeader } from "@/components/ui/PageHeader";
import { decimal, euros, signed } from "@/lib/format";
import { DIMENSIONS, groupBy, RELIABLE_SAMPLE, summarize, type ClosedTrade, type Summary } from "@/lib/journal";
import { captureUrl, getSettings, getTrades, type Trade } from "@/lib/journal-data";
import { formatDay, formatTime } from "@/lib/time";
import { deleteTrade } from "./actions";
import { CloseTradeForm } from "./CloseTradeForm";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Diário" };

const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)}%`);
const rTxt = (x: number | null) => (x === null ? "—" : `${signed(x, 2)}R`);
const rColor = (x: number | null) => (x === null || x === 0 ? "" : x > 0 ? "text-up" : "text-down");

function Tile({ label, value, note, color = "" }: { label: string; value: string; note?: string; color?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-4">
      <Label>{label}</Label>
      <span className={`num text-2xl font-semibold ${color}`}>{value}</span>
      {note && <span className="text-xs text-muted">{note}</span>}
    </div>
  );
}

function ContextLine({ t }: { t: Trade }) {
  const c = t.contexto;
  const bits = [
    c.bias && `macro ${c.bias}`,
    c.trend && `técnica ${c.trend}`,
    c.alignment && c.alignment.toLowerCase(),
    c.risk && `sentimento ${c.risk.label.toLowerCase()} (${c.risk.index})`,
    c.retail && `retalho ${c.retail.longPct}% compra`,
    c.eventsSoon ? `${c.eventsSoon} evento(s) < 2h` : null,
  ].filter(Boolean);
  const failed = t.checklist.filter((x) => x.status === "falha").length;
  const ok = t.checklist.filter((x) => x.status === "ok").length;
  return (
    <p className="text-xs text-muted">
      Na entrada: {bits.join(" · ")} · checklist {ok} ✓ / {failed} ✕
    </p>
  );
}

async function Capture({ path }: { path: string }) {
  const url = await captureUrl(path);
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="text-xs text-up-soft hover:text-ink">
      Ver captura do gráfico ↗
    </a>
  );
}

function OpenTrade({ t }: { t: Trade }) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className={`rounded px-2 py-0.5 text-xs font-semibold text-bg ${t.direcao === "compra" ? "bg-up" : "bg-down"}`}>{t.direcao}</span>
        <span className="num text-lg font-semibold">{t.par}</span>
        <span className="text-[13px] text-muted">
          {formatDay(t.aberta_em)} {formatTime(t.aberta_em)} · {t.estrategia} · {t.emocao}
        </span>
      </header>
      <dl className="num grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-3 text-[13px]">
        {[
          ["Entrada", String(t.preco_entrada)],
          ["Stop", `${t.stop_pips} pips`],
          ["Alvo", t.alvo_pips ? `${t.alvo_pips} pips` : "—"],
          ["Lotes", decimal(t.lotes, 2)],
          ["Risco", euros(t.risco_eur)],
        ].map(([k, v]) => (
          <div key={k} className="flex flex-col">
            <dt className="text-xs text-muted">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <ContextLine t={t} />
      {t.motivo && <p className="text-[13px] text-ink-2">“{t.motivo}”</p>}
      {t.captura_path && (
        <Suspense fallback={null}>
          <Capture path={t.captura_path} />
        </Suspense>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <CloseTradeForm id={t.id} />
        <form action={deleteTrade}>
          <input type="hidden" name="id" value={t.id} />
          <button type="submit" className="min-h-10 cursor-pointer text-xs text-faint hover:text-down-soft">
            Apagar (registo por engano)
          </button>
        </form>
      </div>
    </article>
  );
}

function GroupTable({ title, question, rows }: { title: string; question: string; rows: { key: string; summary: Summary }[] }) {
  if (rows.length === 0) return null;
  return (
    <section className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4">
      <h3 className="text-[14px] font-semibold">{title}</h3>
      <p className="text-xs text-muted">{question}</p>
      <div className="overflow-x-auto">
        <table className="num w-full min-w-[360px] text-[13px]">
          <thead>
            <tr className="text-left text-xs text-faint">
              <th className="py-1 font-normal">Grupo</th>
              <th className="py-1 text-right font-normal">Operações</th>
              <th className="py-1 text-right font-normal">Acerto</th>
              <th className="py-1 text-right font-normal">R médio</th>
              <th className="py-1 text-right font-normal">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-line-soft">
                <td className="py-1.5 font-sans">{r.key}</td>
                <td className="py-1.5 text-right">{r.summary.count}</td>
                <td className="py-1.5 text-right">{pct(r.summary.winRate)}</td>
                <td className={`py-1.5 text-right ${rColor(r.summary.avgR)}`}>{rTxt(r.summary.avgR)}</td>
                <td className={`py-1.5 text-right ${rColor(r.summary.totalR)}`}>{rTxt(r.summary.totalR)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

async function Journal() {
  const [{ trades }, settings] = await Promise.all([getTrades(), getSettings()]);
  const open = trades.filter((t) => t.estado === "aberta");
  const closed = trades.filter((t) => t.estado === "fechada") as unknown as (Trade & ClosedTrade)[];
  const s = summarize(closed);
  const reliable = closed.length >= RELIABLE_SAMPLE;

  return (
    <>
      <Card className="flex flex-col gap-3">
        <CardHeader
          id="conta"
          title="Definições da conta"
          help="O saldo e o risco por operação usados na pré-operação. Atualiza o saldo de vez em quando (por exemplo, todas as semanas) para o tamanho das posições acompanhar a conta."
        />
        {!settings && <p className="text-[13px] text-down-soft">Define o saldo da tua conta para a pré-operação calcular os lotes com o valor certo.</p>}
        <SettingsForm saldo={settings?.saldo ?? null} risco={settings?.risco_pct ?? null} />
      </Card>

      <section aria-labelledby="abertas" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="abertas" className="text-lg font-semibold">
            Operações abertas <span className="num text-muted">({open.length})</span>
          </h2>
          <Link href="/pre-operacao" className="inline-flex min-h-11 items-center rounded-lg bg-up px-4 font-semibold text-bg hover:opacity-90">
            Nova operação
          </Link>
        </div>
        {open.length === 0 ? (
          <p className="text-[13px] text-muted">Sem operações abertas. Regista a próxima a partir da pré-operação, para guardar o contexto da entrada.</p>
        ) : (
          open.map((t) => <OpenTrade key={t.id} t={t} />)
        )}
      </section>

      <section aria-labelledby="resultados" className="flex flex-col gap-3">
        <h2 id="resultados" className="text-lg font-semibold">
          Resultados
        </h2>
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-muted">
            <span>Operações fechadas para conclusões fiáveis</span>
            <span className="num">
              {closed.length} / {RELIABLE_SAMPLE}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-line-soft" role="progressbar" aria-valuenow={closed.length} aria-valuemin={0} aria-valuemax={RELIABLE_SAMPLE} aria-label="Operações fechadas">
            <div className="h-1.5 rounded-full bg-up" style={{ width: `${Math.min(100, (closed.length / RELIABLE_SAMPLE) * 100)}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
          <Tile label="Taxa de acerto" value={pct(s.winRate)} note={`${closed.length} fechadas`} />
          <Tile label="R médio" value={rTxt(s.avgR)} note="expectativa por operação" color={rColor(s.avgR)} />
          <Tile label="Total" value={rTxt(s.totalR)} note={closed.length ? euros(s.totalEur) : undefined} color={rColor(s.totalR)} />
          <Tile label="Ganho / perda média" value={`${rTxt(s.avgWinR)} / ${rTxt(s.avgLossR)}`} />
          <Tile label="Fator de lucro" value={s.profitFactor === null ? "—" : decimal(s.profitFactor, 2)} note="ganhos ÷ perdas" />
          <Tile label="Queda máxima" value={closed.length ? `−${decimal(s.maxDrawdownR, 2)}R` : "—"} />
        </div>
        {closed.length > 0 && !reliable && (
          <p className="rounded-md border border-dashed border-down-line px-3 py-2 text-xs text-down-soft">
            Amostra pequena ({closed.length} operações): os números abaixo mostram tendências, não conclusões. Ficam fiáveis a partir de {RELIABLE_SAMPLE}.
          </p>
        )}
        {closed.length === 0 ? (
          <p className="text-[13px] text-muted">As estatísticas aparecem quando fechares a primeira operação.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-3">
            {DIMENSIONS.map((d) => (
              <GroupTable key={d.id} title={d.title} question={d.question} rows={groupBy(closed, d.keyOf)} />
            ))}
          </div>
        )}
      </section>

      {closed.length > 0 && (
        <section aria-labelledby="historico" className="flex flex-col gap-3">
          <h2 id="historico" className="text-lg font-semibold">
            Histórico
          </h2>
          <ul className="flex flex-col gap-2">
            {closed.map((t) => (
              <li key={t.id}>
                <details className="rounded-lg border border-line bg-surface">
                  <summary className="flex min-h-11 cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
                    <span className="num w-24 text-xs text-muted">{formatDay(t.aberta_em).split(",")[1]?.trim() ?? ""}</span>
                    <span className="num font-semibold">{t.par}</span>
                    <span className="text-xs text-muted">
                      {t.direcao} · {t.estrategia}
                    </span>
                    <span className={`num ml-auto font-semibold ${rColor(t.resultado_r)}`}>{rTxt(t.resultado_r)}</span>
                    <span className={`num w-24 text-right text-[13px] ${rColor(t.resultado_eur)}`}>{t.resultado_eur === null ? "" : euros(t.resultado_eur)}</span>
                    <span className={`text-xs ${t.seguiu_plano ? "text-up-soft" : "text-down-soft"}`}>{t.seguiu_plano ? "seguiu o plano" : "fora do plano"}</span>
                  </summary>
                  <div className="flex flex-col gap-2 border-t border-line-soft px-4 py-3 text-[13px]">
                    <p className="num text-muted">
                      Entrada {t.preco_entrada} → saída {t.preco_saida} · {signed(t.resultado_pips ?? 0, 1)} pips · {decimal(t.lotes, 2)} lotes · emoção: {t.emocao}
                    </p>
                    <ContextLine t={t} />
                    {t.motivo && <p className="text-ink-2">Motivo: “{t.motivo}”</p>}
                    {t.licoes && <p className="text-ink-2">Lições: “{t.licoes}”</p>}
                    {t.captura_path && (
                      <Suspense fallback={null}>
                        <Capture path={t.captura_path} />
                      </Suspense>
                    )}
                    <form action={deleteTrade}>
                      <input type="hidden" name="id" value={t.id} />
                      <button type="submit" className="cursor-pointer text-xs text-faint hover:text-down-soft">
                        Apagar esta operação
                      </button>
                    </form>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

export default function DiarioPage() {
  return (
    <>
      <PageHeader title="Diário" subtitle="As tuas operações, o contexto de cada entrada e o que os números dizem sobre ti" />
      <Suspense fallback={<Card><p className="text-muted">A carregar o diário…</p></Card>}>
        <Journal />
      </Suspense>
      <Disclaimer source="Fonte: operações registadas por ti · resultados em € calculados a partir dos preços (ou o valor real do MT5, se indicado)" />
    </>
  );
}
