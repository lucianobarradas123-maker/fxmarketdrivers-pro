"use client";

import { useEffect, useMemo, useState } from "react";
import { LineChart, type HLine, type LineDef } from "@/components/charts/LineChart";
import { Card, CardHeader } from "@/components/ui/Card";
import type { Currency } from "@/lib/data/types";
import { signed } from "@/lib/format";
import { CURRENCIES_ORDER, rebase, type RiskDay, type StrengthDay } from "@/lib/history";
import { riskLabel } from "@/lib/sentiment";

type View = "sentimento" | "moedas";
interface MacroRow {
  dia: string;
  moeda: Currency;
  total: number;
  dados: number;
  banco: number;
  risco: number;
}

/** Cores das moedas (distintas no fundo escuro). */
export const CURRENCY_COLOR: Record<Currency, string> = {
  USD: "#5aa9ff",
  EUR: "#c084fc",
  GBP: "#f472b6",
  JPY: "#f5a04a",
  CHF: "#f87171",
  CAD: "#2dd4bf",
  AUD: "#facc15",
  NZD: "#4ade80",
};
const COMPONENT = [
  { key: "vix", name: "VIX", color: "#f87171" },
  { key: "spx", name: "S&P 500", color: "#5aa9ff" },
  { key: "audjpy", name: "AUD/JPY", color: "#4ade80" },
  { key: "ouro", name: "Ouro (inv.)", color: "#facc15" },
] as const;
const ZONES: HLine[] = [
  { value: 75, color: "#5aa9ff", label: "ganância extrema" },
  { value: 55, color: "#6b7a8c", label: "ganância" },
  { value: 45, color: "#6b7a8c", label: "medo" },
  { value: 25, color: "#f5a04a", label: "medo extremo" },
];

const PERIODS = {
  sentimento: [
    ["3M", 91],
    ["6M", 182],
    ["1A", 365],
    ["2A", 730],
  ],
  moedas: [
    ["1M", 30],
    ["3M", 91],
    ["6M", 182],
    ["12M", 365],
  ],
} as const;

const since = (days: number) => new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
const fmtDate = (d: string) => new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`)).replace(".", "");

function useJson<T>(url: string, enabled: boolean) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    fetch(url)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (body.retryAfter) timer = setTimeout(() => setRetry((n) => n + 1), body.retryAfter * 1000);
        if (!r.ok) throw new Error(body.error ?? "Erro ao obter o histórico.");
        return body as T;
      })
      .then((d) => !cancelled && (setData(d), setError(null)))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [url, enabled, retry]);
  return { data, error };
}

function Chips<T extends string>({ options, value, onChange, label }: { options: readonly (readonly [T, number])[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex min-h-11 overflow-hidden rounded-lg border border-line-strong">
      {options.map(([k]) => (
        <button key={k} role="radio" aria-checked={value === k} onClick={() => onChange(k)} className={`num min-w-12 cursor-pointer px-3 text-sm font-semibold ${value === k ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"}`}>
          {k}
        </button>
      ))}
    </div>
  );
}

function Sentiment() {
  const { data, error } = useJson<{ days: RiskDay[]; source: string }>("/api/historico/sentimento", true);
  const [period, setPeriod] = useState<string>("1A");
  const [showParts, setShowParts] = useState(false);
  const days = useMemo(() => {
    const n = PERIODS.sentimento.find(([k]) => k === period)![1];
    return (data?.days ?? []).filter((d) => d.date >= since(n));
  }, [data, period]);

  const main: LineDef[] = useMemo(() => [{ name: "Sentimento", color: "#e7ecf2", data: days.map((d) => ({ time: d.date, value: d.index })) }], [days]);
  const parts: LineDef[] = useMemo(
    () => COMPONENT.map((c) => ({ name: c.name, color: c.color, width: 1, data: days.map((d) => ({ time: d.date, value: d.scores[c.key] })) })),
    [days],
  );
  const zeroLine = useMemo<HLine[]>(() => [{ value: 0, color: "#3a4654", label: "" }], []);

  const stats = useMemo(() => {
    if (!days.length) return null;
    const idx = days.map((d) => d.index);
    const min = days.reduce((a, b) => (b.index < a.index ? b : a));
    const max = days.reduce((a, b) => (b.index > a.index ? b : a));
    return {
      now: days.at(-1)!,
      avg: Math.round(idx.reduce((s, v) => s + v, 0) / idx.length),
      min,
      max,
      fear: Math.round((idx.filter((v) => v < 45).length / idx.length) * 100),
      greed: Math.round((idx.filter((v) => v > 55).length / idx.length) * 100),
    };
  }, [days]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Chips label="Período" options={PERIODS.sentimento} value={period} onChange={setPeriod} />
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[13px] text-ink-2">
          <input type="checkbox" checked={showParts} onChange={(e) => setShowParts(e.target.checked)} className="size-4 accent-[var(--color-up)]" />
          Mostrar os 4 componentes
        </label>
      </div>
      {error && <p role="alert" className="rounded-md border border-down-line bg-down/10 px-3 py-2 text-[13px] text-down-soft">{error}</p>}
      {stats && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
          {[
            ["Hoje", `${stats.now.index} · ${riskLabel(stats.now.index)}`],
            ["Média do período", String(stats.avg)],
            ["Maior medo", `${stats.min.index} · ${fmtDate(stats.min.date)}`],
            ["Maior ganância", `${stats.max.index} · ${fmtDate(stats.max.date)}`],
            ["Tempo em medo / ganância", `${stats.fear}% / ${stats.greed}%`],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-3">
              <span className="text-xs text-muted">{k}</span>
              <span className="num text-[15px] font-semibold">{v}</span>
            </div>
          ))}
        </div>
      )}
      <Card className="flex flex-col gap-2 p-3">
        <CardHeader id="g-sent" title="Sentimento de risco (0 = medo extremo · 100 = ganância extrema)" tag="analise" />
        {days.length ? <LineChart lines={main} hlines={ZONES} precision={0} ariaLabel="Gráfico do sentimento de risco ao longo do tempo" /> : <p className="py-16 text-center text-muted">{error ? "—" : "A carregar…"}</p>}
      </Card>
      {showParts && days.length > 0 && (
        <Card className="flex flex-col gap-2 p-3">
          <CardHeader
            id="g-comp"
            title="Componentes (−1 = medo · +1 = apetite pelo risco)"
            tag="analise"
            help="Cada componente vai de −1 a +1. O índice é a média dos quatro, convertida para 0–100. VIX alto, S&P 500 e AUD/JPY abaixo da média de 50 dias, e ouro acima dela, puxam para o medo."
          />
          <div className="flex flex-wrap gap-x-4 gap-y-1 px-2 text-xs text-muted">
            {COMPONENT.map((c) => (
              <span key={c.key}>
                <span className="mr-1 inline-block h-0.5 w-4 align-middle" style={{ background: c.color }} />
                {c.name}
              </span>
            ))}
          </div>
          <LineChart lines={parts} hlines={zeroLine} height={260} precision={2} ariaLabel="Gráfico dos quatro componentes do sentimento de risco" />
        </Card>
      )}
      {data && <p className="text-[11px] text-faint">{data.source}. Histórico recalculado; cada dia usa só dados disponíveis até esse dia.</p>}
    </div>
  );
}

function Currencies({ initial }: { initial: Currency[] }) {
  const { data, error } = useJson<{ price: StrengthDay[] | null; priceError: string | null; macro: MacroRow[]; source: string }>("/api/historico/moedas", true);
  const [period, setPeriod] = useState<string>("3M");
  const [sel, setSel] = useState<Currency[]>(initial.length ? initial : ["USD", "JPY"]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("vista", "moedas");
    url.searchParams.set("moedas", sel.join(","));
    window.history.replaceState(null, "", url);
  }, [sel]);

  const toggle = (c: Currency) => setSel((s) => (s.includes(c) ? (s.length > 1 ? s.filter((x) => x !== c) : s) : [...s, c]));
  const n = PERIODS.moedas.find(([k]) => k === period)![1];

  const price = useMemo(() => (data?.price ? rebase(data.price, since(n)) : []), [data, n]);
  const priceLines: LineDef[] = useMemo(
    () => sel.map((c) => ({ name: c, color: CURRENCY_COLOR[c], data: price.map((d) => ({ time: d.date, value: d.values[c] })) })),
    [price, sel],
  );
  const macroLines: LineDef[] = useMemo(
    () =>
      sel.map((c) => ({
        name: c,
        color: CURRENCY_COLOR[c],
        data: (data?.macro ?? []).filter((r) => r.moeda === c && r.dia >= since(n)).map((r) => ({ time: r.dia, value: r.total })),
      })),
    [data, sel, n],
  );
  const macroDays = new Set((data?.macro ?? []).map((r) => r.dia)).size;
  const firstMacro = data?.macro[0]?.dia;
  const zero = useMemo<HLine[]>(() => [{ value: 0, color: "#3a4654", label: "" }], []);
  const last = price.at(-1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Moedas a comparar" className="flex flex-wrap gap-1.5">
          {CURRENCIES_ORDER.map((c) => {
            const on = sel.includes(c);
            return (
              <button
                key={c}
                aria-pressed={on}
                onClick={() => toggle(c)}
                className={`num min-h-11 min-w-14 cursor-pointer rounded-lg border px-3 text-sm font-semibold transition-colors ${on ? "border-transparent text-bg" : "border-line-strong text-muted hover:text-ink"}`}
                style={on ? { background: CURRENCY_COLOR[c] } : undefined}
              >
                {c}
              </button>
            );
          })}
        </div>
        <Chips label="Período" options={PERIODS.moedas} value={period} onChange={setPeriod} />
      </div>
      {(error || data?.priceError) && (
        <p role="alert" className="rounded-md border border-down-line bg-down/10 px-3 py-2 text-[13px] text-down-soft">
          {error ?? data?.priceError}
        </p>
      )}

      <Card className="flex flex-col gap-2 p-3">
        <CardHeader
          id="g-preco"
          title="Força pelo preço (% face à média das 8 moedas)"
          tag="informacao"
          help="Quanto cada moeda se valorizou ou desvalorizou face à média das 8, desde o início do período escolhido. Calculado a partir dos preços diários de 7 pares contra o USD (os outros cruzamentos derivam destes). Mostra o que o mercado JÁ fez."
        />
        {last && (
          <p className="px-2 text-[13px] text-ink-2">
            No período:{" "}
            {sel
              .map((c) => ({ c, v: last.values[c] }))
              .sort((a, b) => b.v - a.v)
              .map(({ c, v }) => (
                <span key={c} className="num mr-3" style={{ color: CURRENCY_COLOR[c] }}>
                  {c} {signed(v, 1)}%
                </span>
              ))}
          </p>
        )}
        {price.length ? <LineChart lines={priceLines} hlines={zero} precision={1} suffix="%" ariaLabel="Gráfico da força das moedas pelo preço" /> : <p className="py-16 text-center text-muted">{error || data?.priceError ? "—" : "A carregar…"}</p>}
      </Card>

      <Card className="flex flex-col gap-2 p-3">
        <CardHeader
          id="g-macro"
          title="Força macro (pontuação da app, −3 a +3)"
          tag="analise"
          help="A pontuação total que vês no painel e no ecrã Macro (dados + a tua leitura do banco central + sentimento de risco), registada uma vez por dia quando abres a app. Compara com a força pelo preço: se a macro antecipa o mercado, as linhas de cima acabam por seguir as de baixo."
        />
        {macroDays >= 2 ? (
          <LineChart lines={macroLines} hlines={zero} precision={1} height={300} ariaLabel="Gráfico da força macro das moedas" />
        ) : (
          <p className="px-2 py-8 text-[13px] text-muted">
            {firstMacro
              ? `O registo começou a ${fmtDate(firstMacro)}. O gráfico aparece a partir do segundo dia e enche-se à medida que usas a app.`
              : "O registo começa hoje, ao abrires o painel ou o ecrã Macro. O gráfico aparece a partir do segundo dia."}
          </p>
        )}
        {macroDays > 0 && <p className="px-2 text-[11px] text-faint">{macroDays} dia(s) registados · os dias em que não abres a app ficam ligados por uma linha.</p>}
      </Card>
      {data && <p className="text-[11px] text-faint">{data.source}</p>}
      {sel.length === 1 && last && <p className="text-xs text-faint">Dica: escolhe outra moeda para comparar (por exemplo, a outra moeda do par que estás a analisar).</p>}
    </div>
  );
}

export function HistoryView() {
  const [view, setView] = useState<View>("sentimento");
  const [initial, setInitial] = useState<Currency[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const v = q.get("vista");
    const m = (q.get("moedas") ?? "").split(",").filter((c): c is Currency => (CURRENCIES_ORDER as string[]).includes(c));
    /* eslint-disable react-hooks/set-state-in-effect -- leitura única do endereço */
    if (v === "moedas" || v === "sentimento") setView(v);
    setInitial(m);
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const choose = (v: View) => {
    setView(v);
    const url = new URL(window.location.href);
    url.searchParams.set("vista", v);
    window.history.replaceState(null, "", url);
  };

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Histórico" className="flex self-start overflow-hidden rounded-lg border border-line-strong">
        {(
          [
            ["sentimento", "Sentimento de risco"],
            ["moedas", "Moedas"],
          ] as const
        ).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={view === k} onClick={() => choose(k)} className={`min-h-11 cursor-pointer px-4 text-sm font-semibold ${view === k ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"}`}>
            {label}
          </button>
        ))}
      </div>
      {ready && (view === "sentimento" ? <Sentiment /> : <Currencies initial={initial} />)}
    </div>
  );
}
