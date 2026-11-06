import { Card, CardHeader } from "@/components/ui/Card";
import { signed } from "@/lib/format";
import type { BankStance, CurrencyMacro } from "@/lib/data/types";

const STANCE_STYLE: Record<BankStance, string> = {
  Restritivo: "text-up border-up-line",
  Neutro: "text-ink-2 border-line-strong",
  Expansionista: "text-down border-down-line",
};

const HELP =
  "Mede a força relativa de cada moeda segundo a macroeconomia. Soma duas partes: os DADOS (juros, inflação face à meta, emprego e surpresas económicas, calculados automaticamente) e a tua LEITURA do banco central (restritivo +1, neutro 0, expansionista −1). Não é um sinal de compra ou venda — é contexto.";

export function CurrencyStrength({ currencies }: { currencies: (CurrencyMacro & { total: number })[] }) {
  return (
    <Card className="flex min-w-0 flex-[999_1_600px] flex-col gap-3.5">
      <CardHeader
        id="forca"
        title="Força macro das moedas"
        tag="analise"
        help={HELP}
        aside="Pontuação = dados (automático) + banco central (a tua leitura)"
      />
      <div className="hidden items-center gap-x-3.5 sm:flex" aria-hidden="true">
        <div className="w-[110px]" />
        <div className="num grid flex-[1_1_220px] grid-cols-3 text-[11px] text-faint">
          <span>−3 fraca</span>
          <span className="text-center">0</span>
          <span className="text-right">forte +3</span>
        </div>
        <div className="w-12" />
        <div className="w-[196px]" />
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
              <div className="flex flex-none gap-1.5 max-sm:w-full max-sm:pl-[62px] sm:w-[196px]">
                <span className="num w-[90px] rounded bg-surface-2 px-2 py-0.5 text-center text-xs text-ink-2">Dados {signed(c.dataScore)}</span>
                <span className={`w-[100px] rounded border px-2 py-px text-center text-xs ${STANCE_STYLE[c.stance]}`}>{c.stance}</span>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-faint">
        Dados: juros, inflação vs. meta, emprego e surpresas económicas · Leitura do banco central revista após cada reunião
      </p>
    </Card>
  );
}
