"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, Label } from "@/components/ui/Card";
import { decimal, euros, signed } from "@/lib/format";
import { PAIRS } from "@/lib/pairs";
import { positionSize, type PositionResult } from "@/lib/risk";

interface Market {
  pair: string;
  price: number;
  lastBar: string;
  pipValue: number;
  atr: number;
  atrAvg: number;
  vol: "baixa" | "normal" | "elevada";
  trend: "ascendente" | "descendente" | "lateral";
  macro: { base: number; quote: number; divergence: number; bias: "altista" | "baixista" | "neutro"; alignment: string };
  risk: { index: number; label: string; pairBeta: number } | null;
  events: { time: string; currency: string; name: string }[];
  now: number;
  source: { prices: string; fetchedAt: string; macro: string };
}

type Status = "ok" | "alerta" | "falha" | "pendente";
const STORAGE = "fxmd-pre-operacao";

// Regras do plano (D40)
const MIN_STOP_ATR = 0.5;
const MIN_RR = 1.5;
const EVENT_WINDOW_H = 2;

const input =
  "num min-h-11 w-full rounded-lg border border-line-strong bg-bg px-3 text-[15px] text-ink outline-none transition-colors focus:border-up";

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE) ?? "{}") as { balance?: string; riskPct?: string; pair?: string };
  } catch {
    return {};
  }
}

function hoursUntil(iso: string, now: number) {
  return (new Date(iso).getTime() - now) / 3_600_000;
}

function fmtWhen(iso: string) {
  return new Intl.DateTimeFormat("pt-PT", { weekday: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Lisbon" }).format(new Date(iso));
}

const STATUS_STYLE: Record<Status, string> = {
  ok: "bg-up text-bg",
  alerta: "border border-down text-down",
  falha: "bg-down text-bg",
  pendente: "border border-line-strong text-faint",
};
const STATUS_ICON: Record<Status, string> = { ok: "✓", alerta: "!", falha: "✕", pendente: "·" };
const STATUS_LABEL: Record<Status, string> = { ok: "cumprido", alerta: "atenção", falha: "não cumprido", pendente: "por avaliar" };

export function PreTrade() {
  const [pair, setPair] = useState("EUR/USD");
  const [side, setSide] = useState<"compra" | "venda">("compra");
  const [balance, setBalance] = useState("10000");
  const [riskPct, setRiskPct] = useState("1");
  const [stop, setStop] = useState("");
  const [target, setTarget] = useState("");
  const [market, setMarket] = useState<Market | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Preferências guardadas neste dispositivo (saldo, risco, último par).
  useEffect(() => {
    const p = loadPrefs();
    /* eslint-disable react-hooks/set-state-in-effect -- leitura única de preferências locais */
    if (p.balance) setBalance(p.balance);
    if (p.riskPct) setRiskPct(p.riskPct);
    if (p.pair && PAIRS.includes(p.pair)) setPair(p.pair);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify({ balance, riskPct, pair }));
    } catch {
      /* armazenamento indisponível: ignora */
    }
  }, [balance, riskPct, pair]);

  useEffect(() => {
    let cancelled = false;
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- início de pedido de rede */
    setLoading(true);
    setError(null);
    fetch(`/api/mercado?par=${encodeURIComponent(pair)}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "Erro ao obter dados de mercado.");
        return body as Market;
      })
      .then((m) => !cancelled && setMarket(m))
      .catch((e: Error) => !cancelled && (setError(e.message), setMarket(null)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [pair]);

  const num = (v: string) => Number(v.replace(",", "."));
  const result: PositionResult | null = useMemo(() => {
    if (!market) return null;
    try {
      return positionSize({
        balance: num(balance),
        riskPct: num(riskPct),
        stopPips: num(stop),
        targetPips: target ? num(target) : null,
        pipValue: market.pipValue,
      });
    } catch {
      return null;
    }
  }, [market, balance, riskPct, stop, target]);

  const stopAtr = market && num(stop) > 0 ? num(stop) / market.atr : null;
  const soonEvents = market ? market.events.filter((e) => hoursUntil(e.time, market.now) <= EVENT_WINDOW_H && hoursUntil(e.time, market.now) >= 0) : [];
  const riskTooHigh = num(riskPct) > 2;

  const checks: { label: string; status: Status; detail: string }[] = market
    ? [
        (() => {
          const want = side === "compra" ? "altista" : "baixista";
          const s: Status = market.macro.bias === "neutro" ? "alerta" : market.macro.bias === want ? "ok" : "falha";
          return { label: "A favor do viés macro", status: s, detail: `Viés ${market.macro.bias} (divergência ${signed(market.macro.divergence)})` };
        })(),
        (() => {
          const want = side === "compra" ? "ascendente" : "descendente";
          const s: Status = market.trend === "lateral" ? "alerta" : market.trend === want ? "ok" : "falha";
          return { label: "Tendência técnica confirma", status: s, detail: `Tendência diária ${market.trend}` };
        })(),
        {
          label: `Stop fora do ruído (≥ ${decimal(MIN_STOP_ATR)}× ATR)`,
          status: stopAtr === null ? "pendente" : stopAtr >= MIN_STOP_ATR ? "ok" : "falha",
          detail: stopAtr === null ? `Mínimo sugerido: ${Math.ceil(market.atr * MIN_STOP_ATR)} pips` : `Stop = ${decimal(stopAtr, 2)}× ATR (${decimal(market.atr, 0)} pips)`,
        },
        {
          label: `Sem evento de alto impacto nas próximas ${EVENT_WINDOW_H}h`,
          status: soonEvents.length ? "falha" : "ok",
          detail: soonEvents.length ? soonEvents.map((e) => `${e.currency} ${e.name}`).join(" · ") : "Nenhum no teu calendário",
        },
        {
          label: `Risco/retorno ≥ 1:${decimal(MIN_RR)}`,
          status: !result?.rr ? "pendente" : result.rr >= MIN_RR ? "ok" : "falha",
          detail: result?.rr ? `1:${decimal(result.rr, 2)}` : "Indica o alvo em pips",
        },
      ]
    : [];
  const passed = checks.filter((c) => c.status === "ok").length;

  // Exposição ao sentimento: comprar o par = comprar a base e vender a cotada.
  const riskExposure = market?.risk ? (side === "compra" ? 1 : -1) * market.risk.pairBeta : 0;
  const riskWarning =
    market?.risk && riskExposure > 0 && market.risk.index < 45
      ? `Estás do lado das moedas de risco num ambiente de ${market.risk.label.toLowerCase()} (${market.risk.index}/100).`
      : market?.risk && riskExposure < 0 && market.risk.index > 55
        ? `Estás do lado das moedas-refúgio num ambiente de ${market.risk.label.toLowerCase()} (${market.risk.index}/100).`
        : null;

  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-4">
        <Card className="flex flex-col gap-4">
          <CardHeader id="op" title="A operação" />
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-xs text-muted">
              Par
              <select value={pair} onChange={(e) => setPair(e.target.value)} className={input}>
                {PAIRS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <fieldset className="flex flex-col gap-1.5 text-xs text-muted">
              <legend className="mb-1.5">Direção</legend>
              <div className="grid min-h-11 grid-cols-2 overflow-hidden rounded-lg border border-line-strong">
                {(["compra", "venda"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={side === s}
                    onClick={() => setSide(s)}
                    className={`cursor-pointer text-sm font-semibold capitalize transition-colors ${
                      side === s ? (s === "compra" ? "bg-up text-bg" : "bg-down text-bg") : "text-ink-2 hover:text-ink"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="flex flex-col gap-1.5 text-xs text-muted">
              Saldo da conta (€)
              <input inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} className={input} />
            </label>
            <label className="flex flex-col gap-1.5 text-xs text-muted">
              Risco (%)
              <input inputMode="decimal" value={riskPct} onChange={(e) => setRiskPct(e.target.value)} className={input} />
            </label>
            <label className="flex flex-col gap-1.5 text-xs text-muted">
              Stop (pips)
              <input inputMode="decimal" value={stop} onChange={(e) => setStop(e.target.value)} placeholder={market ? `≥ ${Math.ceil(market.atr * MIN_STOP_ATR)}` : ""} className={input} />
            </label>
            <label className="flex flex-col gap-1.5 text-xs text-muted">
              Alvo (pips)
              <input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="opcional" className={input} />
            </label>
          </div>
          {riskTooHigh && (
            <p role="alert" className="rounded-md border border-down-line bg-down/10 px-3 py-2 text-[13px] text-down-soft">
              Risco acima de 2% por operação. A tua regra é 1%.
            </p>
          )}
        </Card>

        <Card className={`flex flex-col gap-3 ${result && !result.tooSmall ? "border-up-line" : ""}`}>
          <Label>Tamanho de posição</Label>
          {!market ? (
            <p className="text-muted">{loading ? "A obter dados do par…" : "Sem dados de mercado."}</p>
          ) : !result ? (
            <p className="text-muted">Indica o saldo, o risco e o stop.</p>
          ) : result.tooSmall ? (
            <p className="text-down-soft">O risco permitido não chega para o lote mínimo (0,01). Reduz o stop (sem ficar abaixo do mínimo do teu plano) ou não abras esta operação.</p>
          ) : (
            <>
              <p className="flex items-baseline gap-2">
                <span className="num text-[34px] font-semibold tracking-tight">{decimal(result.lots, 2)}</span>
                <span className="text-muted">lotes</span>
              </p>
              <dl className="grid grid-cols-3 gap-2 text-xs text-muted">
                <div className="flex flex-col-reverse">
                  <dt>Perda máx.</dt>
                  <dd className="num text-sm text-down">−{euros(result.riskActual)}</dd>
                </div>
                <div className="flex flex-col-reverse">
                  <dt>Ganho alvo</dt>
                  <dd className="num text-sm text-up">{result.gainTarget ? `+${euros(result.gainTarget)}` : "—"}</dd>
                </div>
                <div className="flex flex-col-reverse">
                  <dt>Risco/retorno</dt>
                  <dd className="num text-sm text-ink">{result.rr ? `1 : ${decimal(result.rr, 2)}` : "—"}</dd>
                </div>
              </dl>
              <p className="text-xs text-faint">
                Arredondado para baixo ao passo de 0,01 lotes · valor do pip: {decimal(market.pipValue, 2)} €/lote
              </p>
            </>
          )}
        </Card>
      </div>

      <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-4">
        {error && (
          <p role="alert" className="rounded-md border border-down-line bg-down/10 px-3 py-2 text-[13px] text-down-soft">
            {error}
          </p>
        )}
        {soonEvents.length > 0 && (
          <div role="alert" className="flex flex-col gap-1 rounded-xl border border-down-line bg-down/10 p-4">
            <span className="font-semibold text-down-soft">Evento de alto impacto em menos de {EVENT_WINDOW_H}h</span>
            {soonEvents.map((e) => (
              <span key={e.time + e.name} className="text-[13px] text-down-soft">
                {fmtWhen(e.time)} · {e.currency} · {e.name}
              </span>
            ))}
            <span className="text-xs text-[#c9b49a]">Spreads e volatilidade podem disparar.</span>
          </div>
        )}

        <Card className="flex flex-col gap-3">
          <CardHeader id="plano" title="O teu plano" tag="analise" aside={market ? `${passed} de ${checks.length} cumpridos` : undefined} />
          {market ? (
            <ul className="flex flex-col gap-2.5">
              {checks.map((c) => (
                <li key={c.label} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 grid size-5 flex-none place-items-center rounded-md text-xs font-bold ${STATUS_STYLE[c.status]}`}
                    aria-label={STATUS_LABEL[c.status]}
                  >
                    {STATUS_ICON[c.status]}
                  </span>
                  <span className="flex flex-col">
                    <span className={c.status === "falha" ? "text-down-soft" : ""}>{c.label}</span>
                    <span className="text-xs text-muted">{c.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">{loading ? "A avaliar…" : "—"}</p>
          )}
          {riskWarning && (
            <p className="rounded-md border border-down-line bg-down/10 px-3 py-2 text-[13px] text-down-soft">
              <span className="font-semibold">Sentimento de risco: </span>
              {riskWarning}
            </p>
          )}
          <p className="text-xs text-faint">Verificação do teu plano, não um sinal. A decisão de entrar é sempre tua.</p>
        </Card>

        {market && (
          <Card className="flex flex-col gap-3">
            <CardHeader id="contexto" title={`Contexto ${market.pair}`} tag="informacao" />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
              <div className="flex flex-col">
                <dt className="text-xs text-muted">Último fecho diário</dt>
                <dd className="num">{market.price}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs text-muted">Volatilidade (ATR 14 dias)</dt>
                <dd className="num">
                  {decimal(market.atr, 0)} pips <span className={market.vol === "elevada" ? "text-down-soft" : "text-muted"}>· {market.vol}</span>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs text-muted">Tendência diária</dt>
                <dd>{market.trend}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs text-muted">Sentimento de risco</dt>
                <dd>{market.risk ? `${market.risk.label} (${market.risk.index}/100)` : "indisponível"}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs text-muted">Macro vs. técnica</dt>
                <dd>
                  {market.macro.bias} · {market.macro.alignment.toLowerCase()}
                </dd>
              </div>
            </dl>
            <p className="text-xs text-faint">
              Preços: {market.source.prices}, último dia {market.lastBar}. Não são os preços da tua corretora. Macro: {market.source.macro}.
            </p>
          </Card>
        )}

        <button type="button" disabled className="min-h-12 cursor-not-allowed rounded-lg border border-line-strong font-semibold text-faint" title="Disponível na Etapa 4">
          Registar no diário · disponível na Etapa 4
        </button>
      </div>
    </div>
  );
}
