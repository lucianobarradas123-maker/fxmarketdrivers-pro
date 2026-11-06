/**
 * Fichas dos bancos centrais — dados INSERIDOS MANUALMENTE (D11, D24).
 * Rever após cada reunião. Leituras confirmadas pelo utilizador em 06/11/2026.
 * Ver docs/BANCOS-CENTRAIS.md para o histórico e a justificação.
 */
import type { BankStance, Currency } from "@/lib/data/types";

export interface CentralBank {
  code: Currency;
  bank: string;
  bankName: string;
  /** Taxa de referência em % (ponto médio no caso de um intervalo). */
  rate: number;
  rateLabel: string;
  /** Meta de inflação em % (ponto médio no caso de um intervalo). */
  inflationTarget: number;
  targetLabel: string;
  lastDecision: { date: string; text: string };
  nextMeeting: string;
  stance: BankStance;
  reasoning: string;
  sources: { label: string; url: string }[];
}

export const BANKS_REVIEWED_AT = "2026-11-06";

export const CENTRAL_BANKS: CentralBank[] = [
  {
    code: "USD",
    bank: "Fed",
    bankName: "Reserva Federal dos EUA",
    rate: 3.875,
    rateLabel: "3,75–4,00%",
    inflationTarget: 2,
    targetLabel: "2%",
    lastDecision: { date: "2026-10-28", text: "Manteve (10–2; dois votos por subir)" },
    nextMeeting: "2026-12-09",
    stance: "Restritivo",
    reasoning: "Subiu em setembro; os dissidentes querem subir mais e o mercado espera nova subida.",
    sources: [{ label: "CNBC, 28/10/2026", url: "https://www.cnbc.com/2026/10/28/fed-interest-rate-decision-october-2026.html" }],
  },
  {
    code: "EUR",
    bank: "BCE",
    bankName: "Banco Central Europeu",
    rate: 2.5,
    rateLabel: "2,50% (depósito)",
    inflationTarget: 2,
    targetLabel: "2%",
    lastDecision: { date: "2026-10-29", text: "Manteve" },
    nextMeeting: "2026-12-17",
    stance: "Lig. restritivo",
    reasoning: "Subiu em setembro; inflação de 3,8%; pausa sem fechar a porta a novas subidas.",
    sources: [{ label: "CNBC, 29/10/2026", url: "https://www.cnbc.com/2026/10/29/european-central-bank-interest-rates.html" }],
  },
  {
    code: "GBP",
    bank: "BoE",
    bankName: "Banco de Inglaterra",
    rate: 4,
    rateLabel: "4,00%",
    inflationTarget: 2,
    targetLabel: "2%",
    lastDecision: { date: "2026-11-05", text: "Subiu 0,25 (8–1; um voto por +0,50)" },
    nextMeeting: "2026-12-17",
    stance: "Restritivo",
    reasoning: "Acabou de subir e prevê inflação perto de 5% em meados de 2027.",
    sources: [{ label: "Bank of England, nov. 2026", url: "https://www.bankofengland.co.uk/monetary-policy-summary-and-minutes/2026/november-2026" }],
  },
  {
    code: "JPY",
    bank: "BoJ",
    bankName: "Banco do Japão",
    rate: 1.25,
    rateLabel: "1,25%",
    inflationTarget: 2,
    targetLabel: "2%",
    lastDecision: { date: "2026-10-30", text: "Manteve (8–1; um voto por subir)" },
    nextMeeting: "2026-12-18",
    stance: "Lig. restritivo",
    reasoning: "Duas subidas em 2026 e indica que continuará a subir a taxa.",
    sources: [{ label: "FatTail, out. 2026", url: "https://fattail.ai/boj-hawkish-hold-october-2026/" }],
  },
  {
    code: "CHF",
    bank: "SNB",
    bankName: "Banco Nacional Suíço",
    rate: 0,
    rateLabel: "0,00%",
    inflationTarget: 1,
    targetLabel: "0–2%",
    lastDecision: { date: "2026-09-24", text: "Manteve" },
    nextMeeting: "2026-12-10",
    stance: "Lig. expansionista",
    reasoning: "Prevê 0% em todo o horizonte e admite intervir no câmbio; o mais brando face aos pares.",
    sources: [{ label: "SNB, 24/09/2026", url: "https://www.snb.ch/en/publications/communication/press-releases-restricted/pre_20260924" }],
  },
  {
    code: "CAD",
    bank: "BoC",
    bankName: "Banco do Canadá",
    rate: 2.5,
    rateLabel: "2,50%",
    inflationTarget: 2,
    targetLabel: "2% (1–3%)",
    lastDecision: { date: "2026-10-28", text: "Subiu 0,25" },
    nextMeeting: "2026-12-09",
    stance: "Lig. restritivo",
    reasoning: "Primeira subida desde 2023; admite subir mais, mas “com cautela”.",
    sources: [{ label: "Bank of Canada, 28/10/2026", url: "https://www.bankofcanada.ca/2026/10/fad-press-release-2026-10-28/" }],
  },
  {
    code: "AUD",
    bank: "RBA",
    bankName: "Banco da Reserva da Austrália",
    rate: 4.85,
    rateLabel: "4,85%",
    inflationTarget: 2.5,
    targetLabel: "2–3%",
    lastDecision: { date: "2026-11-03", text: "Subiu 0,25 (6–3)" },
    nextMeeting: "2026-12-08",
    stance: "Lig. restritivo",
    reasoning: "Quinta subida do ano, mas votação dividida e retirou a indicação de novas subidas.",
    sources: [{ label: "RBA, 03/11/2026", url: "https://www.rba.gov.au/media-releases/2026/mr-26-30.html" }],
  },
  {
    code: "NZD",
    bank: "RBNZ",
    bankName: "Banco da Reserva da Nova Zelândia",
    rate: 2.75,
    rateLabel: "2,75%",
    inflationTarget: 2,
    targetLabel: "2% (1–3%)",
    lastDecision: { date: "2026-10-28", text: "Manteve (4–3), contra o esperado" },
    nextMeeting: "2026-12-09",
    stance: "Neutro",
    reasoning: "O mercado esperava subida; a inflação está a abrandar.",
    sources: [{ label: "FXStreet, 28/10/2026", url: "https://www.fxstreet.com/news/what-can-we-expect-from-the-rbnz-monetary-policy-decision-202610272058" }],
  },
];
