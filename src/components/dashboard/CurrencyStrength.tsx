import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { signed } from "@/lib/format";
import type { BankStance, CurrencyMacro } from "@/lib/data/types";

export const STANCE_STYLE: Record<BankStance, string> = {
  Restritivo: "text-up border-up-line bg-up/10",
  "Lig. restritivo": "text-up-soft border-up-line",
  Neutro: "text-ink-2 border-line-strong",
  "Lig. expansionista": "text-down-soft border-down-line",
  Expansionista: "text-down border-down-line bg-down/10",
};

const HELP =
  "Mede a força relativa de cada moeda segundo a macroeconomia. Soma três partes: os DADOS (juro, inflação face à meta e evolução do emprego, calculados automaticamente com dados da OCDE) e a tua LEITURA do banco central (de restritivo +1 a expansionista −1, em 5 níveis) e o SENTIMENTO DE RISCO (medo favorece JPY, CHF e USD; ganância favorece AUD, NZD e CAD; até ±0,5). Não é um sinal de compra ou venda — é contexto.";

export function CurrencyStrength({ currencies }: { currencies: (CurrencyMacro & { total: number })[] }) {
  return (
    <Card className="flex min-w-0 flex-[999_1_600px] flex-col gap-3.5">
      <CardHeader
        id="forca"
        title="Força macro das moedas"
        tag="analise"
        help={HELP}
        aside="Pontuação = dados + banco central (a tua leitura) + sentimento de risco"
      />
      <div className="hidden items-center gap-x-3.5 sm:flex" aria-hidden="true">
        <div className="w-[110px]" />
        <div className="num grid flex-[1_1_220px] grid-cols-3 text-[11px] text-faint">
          <span>−3 fraca</span>
          <span className="text-center">0</span>
          <span className="text-right">forte +3</span>
        </div>
        <div className="w-12" />
        <div className="w-[220px]" />
      </div>
      <ol aria-labelledby="forca">
        {currencies.map((c) => {
          const pct = (Math.abs(c.total) / 3) * 100;
          return (
            <li key={c.code} className="flex flex-wrap items-center gap-x-3.5 gap-y-2 border-t border-line-soft py-2">
              <div className="flex w-12 flex-col sm:w-[110px]">
                <span className="num text-[15px] font-semibold">{c.code}</span>
                <span className="text-xs text-faint">{c.bank}</span>
              </div>
              <div className="grid h-3.5 flex-[1_1_120px] grid-cols-2 items-center sm:flex-[1_1_220px]" aria-hidden="true">
                <div className="flex h-full items-center justify-end border-r border-[#3a4654]">
                  {c.total < 0 && <div className="h-2.5 rounded-l-[3px] bg-down transition-[width] duration-500" style={{ width: `${pct}%` }} />}
                </div>
                <div className="flex h-full items-center">
                  {c.total > 0 && <div className="h-2.5 rounded-r-[3px] bg-up transition-[width] duration-500" style={{ width: `${pct}%` }} />}
                </div>
              </div>
              <span className={`num w-12 text-right font-semibold ${c.total >= 0 ? "text-up" : "text-down"}`}>
                {signed(c.total)}
              </span>
              <div className="flex flex-none gap-1.5 max-sm:w-full max-sm:pl-[62px] sm:w-[220px]">
                <span className="num w-[90px] rounded bg-surface-2 px-2 py-0.5 text-center text-xs text-ink-2">Dados {signed(c.dataScore)}</span>
                <span className={`w-[124px] rounded border px-2 py-px text-center text-xs ${STANCE_STYLE[c.stance]}`}>{c.stance}</span>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="flex flex-wrap justify-between gap-2 text-xs text-faint">
        <span>Dados: juro, inflação vs. meta e emprego (OCDE) · Leitura do banco central revista após cada reunião</span>
        <Link href="/macro" className="text-up-soft hover:text-ink">Ver detalhe por moeda</Link>
      </p>
    </Card>
  );
}
