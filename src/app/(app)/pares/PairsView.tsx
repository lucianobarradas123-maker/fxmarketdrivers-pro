"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { decimal, signed } from "@/lib/format";
import { PAIRS } from "@/lib/pairs";
import { PairChart, type ChartLevel, type Frame } from "./PairChart";

type Tf = "H4" | "H1" | "D1";
type Trend = "ascendente" | "descendente" | "lateral";

interface Data {
  pair: string;
  price: number;
  digits: number;
  frames: Record<Tf, Frame & { trend: Trend; atrPips: number; lastTime: string }>;
  levels: (ChartLevel & { distancePips: number })[];
  macro: { bias: "altista" | "baixista" | "neutro"; divergence: number; alignmentH4: string };
  risk: { index: number; label: string } | null;
  events: { time: string; currency: string; name: string }[];
  source: string;
}

const TF_HELP: Record<Tf, string> = { H4: "direção", H1: "entrada", D1: "contexto" };
const TREND_STYLE: Record<Trend, string> = { ascendente: "text-up", descendente: "text-down", lateral: "text-ink-2" };
const ARROW: Record<Trend, string> = { ascendente: "▲", descendente: "▼", lateral: "◆" };

export function PairsView() {
  const [pair, setPair] = useState("EUR/USD");
  const [tf, setTf] = useState<Tf>("H4");
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("par");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- par indicado no endereço
    if (fromUrl && PAIRS.includes(fromUrl)) setPair(fromUrl);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- início de pedido de rede */
    setLoading(true);
    setError(null);
    fetch(`/api/pares?par=${encodeURIComponent(pair)}`)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (r.status === 429 && body.retryAfter) timer = setTimeout(() => setRetry((n) => n + 1), body.retryAfter * 1000);
        if (!r.ok) throw new Error(body.error ?? "Erro ao obter os dados do par.");
        return body as Data;
      })
      .then((d) => !cancelled && setData(d))
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [pair, retry]);

  const h4 = data?.frames.H4.trend;
  const h1 = data?.frames.H1.trend;
  const mtf =
    !h4 || !h1 ? null : h4 === "lateral" ? "H4 sem direção clara" : h1 === h4 ? `H1 confirma a direção do H4 (${h4})` : h1 === "lateral" ? "H1 lateral: aguarda confirmação" : `H1 contra o H4 (possível correção)`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-xs text-muted">
          Par
          <select value={pair} onChange={(e) => setPair(e.target.value)} className="num min-h-11 rounded-lg border border-line-strong bg-bg px-3 text-[15px] text-ink outline-none focus:border-up">
            {PAIRS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <div role="tablist" aria-label="Período do gráfico" className="flex min-h-11 overflow-hidden rounded-lg border border-line-strong">
          {(["H4", "H1", "D1"] as Tf[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tf === t}
              onClick={() => setTf(t)}
              className={`num min-w-16 cursor-pointer px-3 text-sm font-semibold transition-colors ${tf === t ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"}`}
            >
              {t}
              <span className="block text-[10px] font-normal text-faint">{TF_HELP[t]}</span>
            </button>
          ))}
        </div>
        <Link href={`/pre-operacao?par=${encodeURIComponent(pair)}`} className="ml-auto inline-flex min-h-11 items-center rounded-lg bg-up px-4 font-semibold text-bg hover:opacity-90">
          Pré-operação com {pair}
        </Link>
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-down-line bg-down/10 px-3 py-2 text-[13px] text-down-soft">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-start gap-4">
        <Card className="flex min-w-0 flex-[999_1_640px] flex-col gap-2 p-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 text-xs text-muted">
            <span className="num text-sm font-semibold text-ink">
              {pair} · {tf}
            </span>
            <span>
              <span className="inline-block h-0.5 w-4 bg-[#e7ecf2] align-middle" /> EMA 8
            </span>
            <span>
              <span className="inline-block h-0.5 w-4 bg-[#c084fc] align-middle" /> EMA 21
            </span>
            <span className="text-[#9cc8ff]">- - suporte</span>
            <span className="text-[#f5c28a]">- - resistência</span>
            {loading && <span className="ml-auto">A carregar…</span>}
          </div>
          {data ? (
            <PairChart frame={data.frames[tf]} levels={data.levels} digits={data.digits} />
          ) : (
            <div className="grid h-[420px] place-items-center text-muted sm:h-[520px]">{loading ? "A carregar o gráfico…" : "Sem dados"}</div>
          )}
          {data && <p className="px-2 text-[11px] text-faint">{data.source}</p>}
        </Card>

        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <Card className="flex flex-col gap-3">
            <CardHeader id="tecnica" title="Técnica" tag="analise" help="Tendência por período com as EMA 8 e 21: preço acima da EMA 8 e esta acima da EMA 21 → ascendente; o inverso → descendente; caso contrário → lateral. O ATR é a amplitude média de 14 velas desse período, em pips." />
            {data ? (
              <>
                <ul className="flex flex-col gap-2">
                  {(["H4", "H1", "D1"] as Tf[]).map((t) => (
                    <li key={t} className="flex items-center justify-between gap-3 border-t border-line-soft pt-2 first:border-t-0 first:pt-0">
                      <span className="num text-sm font-semibold">
                        {t} <span className="text-xs font-normal text-faint">{TF_HELP[t]}</span>
                      </span>
                      <span className={`text-sm ${TREND_STYLE[data.frames[t].trend]}`}>
                        {ARROW[data.frames[t].trend]} {data.frames[t].trend}
                      </span>
                      <span className="num w-20 text-right text-xs text-muted">ATR {data.frames[t].atrPips} p</span>
                    </li>
                  ))}
                </ul>
                {mtf && <p className="rounded-md bg-inset px-3 py-2 text-[13px] text-ink-2">{mtf}</p>}
              </>
            ) : (
              <p className="text-muted">—</p>
            )}
          </Card>

          <Card className="flex flex-col gap-3">
            <CardHeader
              id="niveis"
              title="Suportes e resistências"
              tag="analise"
              help="Calculados automaticamente a partir dos pontos de viragem do H4 (cerca de 50 dias): topos e fundos próximos são agrupados num nível. ×N = número de toques. Distância em pips ao preço atual."
            />
            {data?.levels.length ? (
              <ul className="num flex flex-col gap-1.5 text-[13px]">
                {data.levels.map((l) => (
                  <li key={`${l.kind}-${l.price}`} className="flex items-center gap-3">
                    <span className={`w-24 text-xs font-sans ${l.kind === "suporte" ? "text-up-soft" : "text-down-soft"}`}>{l.kind}</span>
                    <span className="flex-auto">{decimal(l.price, data.digits)}</span>
                    <span className="text-xs text-muted">×{l.touches}</span>
                    <span className="w-16 text-right text-xs text-muted">{signed(l.distancePips, 0)} p</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">{data ? "Sem níveis claros no período." : "—"}</p>
            )}
          </Card>

          {data && (
            <Card className="flex flex-col gap-2 text-[13px]">
              <CardHeader id="contexto-par" title="Contexto" tag="informacao" />
              <p>
                Macro: <span className={data.macro.bias === "altista" ? "text-up" : data.macro.bias === "baixista" ? "text-down" : ""}>{data.macro.bias}</span> (divergência {signed(data.macro.divergence)}) ·
                H4 {data.macro.alignmentH4.toLowerCase()}
              </p>
              {data.risk && <p>Sentimento: {data.risk.label} ({data.risk.index}/100)</p>}
              {data.events.length > 0 && (
                <p className="text-down-soft">
                  Próximos eventos de alto impacto: {data.events.map((e) => `${e.currency} ${e.name}`).join(" · ")}
                </p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
