/**
 * Eventos pré-definidos por moeda (aprovado pelo utilizador, Etapa 2).
 * O impacto é o habitual para o Forex; pode ser alterado em cada registo.
 */
import type { Currency, Impact } from "@/lib/data/types";

export interface CatalogEvent {
  name: string;
  impact: Impact;
}

const rateDecision = (bank: string): CatalogEvent => ({ name: `Decisão de juros (${bank})`, impact: "alto" });
const speech = (who: string): CatalogEvent => ({ name: `Discurso ${who}`, impact: "alto" });

export const EVENT_CATALOG: Record<Currency, CatalogEvent[]> = {
  USD: [
    rateDecision("Fed"),
    { name: "Payroll não-agrícola (NFP)", impact: "alto" },
    { name: "Taxa de desemprego", impact: "alto" },
    { name: "IPC (inflação)", impact: "alto" },
    { name: "IPC subjacente", impact: "alto" },
    { name: "PCE subjacente", impact: "alto" },
    { name: "PIB", impact: "alto" },
    speech("do presidente da Fed"),
    { name: "Vendas a retalho", impact: "médio" },
    { name: "PMI ISM industrial", impact: "médio" },
    { name: "PMI ISM serviços", impact: "médio" },
    { name: "Ofertas de emprego (JOLTS)", impact: "médio" },
  ],
  EUR: [
    rateDecision("BCE"),
    { name: "Conferência de imprensa do BCE", impact: "alto" },
    { name: "IHPC (inflação) — estimativa rápida", impact: "alto" },
    { name: "PIB", impact: "alto" },
    speech("da presidente do BCE"),
    { name: "PMI compósito", impact: "médio" },
    { name: "Taxa de desemprego", impact: "médio" },
    { name: "Índice Ifo (Alemanha)", impact: "médio" },
    { name: "Sentimento ZEW (Alemanha)", impact: "médio" },
  ],
  GBP: [
    rateDecision("BoE"),
    { name: "IPC (inflação)", impact: "alto" },
    { name: "Emprego e desemprego", impact: "alto" },
    { name: "PIB", impact: "alto" },
    speech("do governador do BoE"),
    { name: "Vendas a retalho", impact: "médio" },
    { name: "PMI de serviços", impact: "médio" },
  ],
  JPY: [
    rateDecision("BoJ"),
    speech("do governador do BoJ"),
    { name: "IPC nacional", impact: "alto" },
    { name: "IPC de Tóquio", impact: "médio" },
    { name: "PIB", impact: "médio" },
    { name: "Inquérito Tankan", impact: "médio" },
  ],
  CHF: [
    rateDecision("SNB"),
    speech("do presidente do SNB"),
    { name: "IPC (inflação)", impact: "médio" },
    { name: "PIB", impact: "médio" },
  ],
  CAD: [
    rateDecision("BoC"),
    { name: "Emprego (variação e taxa de desemprego)", impact: "alto" },
    { name: "IPC (inflação)", impact: "alto" },
    speech("do governador do BoC"),
    { name: "PIB", impact: "médio" },
    { name: "Vendas a retalho", impact: "médio" },
    { name: "Ivey PMI", impact: "médio" },
  ],
  AUD: [
    rateDecision("RBA"),
    { name: "Emprego (variação e taxa de desemprego)", impact: "alto" },
    { name: "IPC (inflação)", impact: "alto" },
    speech("da governadora do RBA"),
    { name: "PIB", impact: "médio" },
    { name: "Vendas a retalho", impact: "médio" },
  ],
  NZD: [
    rateDecision("RBNZ"),
    { name: "IPC trimestral", impact: "alto" },
    { name: "Emprego trimestral", impact: "alto" },
    speech("da governadora do RBNZ"),
    { name: "PIB", impact: "médio" },
  ],
};

export const CURRENCIES: Currency[] = ["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD"];
