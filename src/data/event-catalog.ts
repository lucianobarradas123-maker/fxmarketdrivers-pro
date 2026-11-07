/**
 * Eventos pré-definidos por moeda (aprovado pelo utilizador, Etapa 2).
 * O impacto é o habitual para o Forex; pode ser alterado em cada registo.
 */
import type { Currency, Impact } from "@/lib/data/types";

/** Tipo de evento: os discursos terão campo próprio para o texto e análise (proposta em discussão). */
export type EventKind = "dado" | "decisao" | "discurso" | "politica";

export interface CatalogEvent {
  name: string;
  impact: Impact;
  kind?: EventKind;
}

const rateDecision = (bank: string): CatalogEvent => ({ name: `Decisão de juros (${bank})`, impact: "alto", kind: "decisao" });
const speech = (who: string, impact: Impact = "alto"): CatalogEvent => ({ name: `Discurso ${who}`, impact, kind: "discurso" });
const elections: CatalogEvent = { name: "Eleições legislativas", impact: "alto", kind: "politica" };

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
    { name: "IPP (preços no produtor)", impact: "alto" },
    { name: "IPP subjacente", impact: "alto" },
    { name: "Pedidos semanais de subsídio de desemprego", impact: "alto" },
    speech("de membro do FOMC", "médio"),
    { name: "Sentimento do consumidor (U. Michigan, preliminar)", impact: "médio" },
    { name: "Expectativas de inflação (U. Michigan, preliminar)", impact: "médio" },
    elections,
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
    speech("de membro do BCE", "médio"),
    elections,
  ],
  GBP: [
    rateDecision("BoE"),
    { name: "IPC (inflação)", impact: "alto" },
    { name: "Emprego e desemprego", impact: "alto" },
    { name: "PIB", impact: "alto" },
    speech("do governador do BoE"),
    { name: "Vendas a retalho", impact: "médio" },
    { name: "PMI de serviços", impact: "médio" },
    { name: "PIB trimestral (preliminar)", impact: "médio" },
    speech("de membro do MPC", "médio"),
    elections,
  ],
  JPY: [
    rateDecision("BoJ"),
    speech("do governador do BoJ"),
    { name: "IPC nacional", impact: "alto" },
    { name: "IPC de Tóquio", impact: "médio" },
    { name: "PIB", impact: "médio" },
    { name: "Inquérito Tankan", impact: "médio" },
    speech("de membro do BoJ", "médio"),
    elections,
  ],
  CHF: [
    rateDecision("SNB"),
    speech("do presidente do SNB"),
    { name: "IPC (inflação)", impact: "médio" },
    { name: "PIB", impact: "médio" },
    speech("de membro do SNB", "médio"),
    elections,
  ],
  CAD: [
    rateDecision("BoC"),
    { name: "Emprego (variação e taxa de desemprego)", impact: "alto" },
    { name: "IPC (inflação)", impact: "alto" },
    speech("do governador do BoC"),
    { name: "PIB", impact: "médio" },
    { name: "Vendas a retalho", impact: "médio" },
    { name: "Ivey PMI", impact: "médio" },
    speech("de membro do BoC", "médio"),
    elections,
  ],
  AUD: [
    rateDecision("RBA"),
    { name: "Emprego (variação e taxa de desemprego)", impact: "alto" },
    { name: "IPC (inflação)", impact: "alto" },
    speech("da governadora do RBA"),
    { name: "PIB", impact: "médio" },
    { name: "Vendas a retalho", impact: "médio" },
    speech("de membro do RBA", "médio"),
    elections,
  ],
  NZD: [
    rateDecision("RBNZ"),
    { name: "IPC trimestral", impact: "alto" },
    { name: "Emprego trimestral", impact: "alto" },
    speech("da governadora do RBNZ"),
    { name: "PIB", impact: "médio" },
    speech("de membro do RBNZ", "médio"),
    elections,
  ],
};

export const CURRENCIES: Currency[] = ["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD"];
