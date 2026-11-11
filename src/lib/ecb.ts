/** Taxas de referência do BCE (EUR → outras moedas), publicadas por volta das 16h CET em dias úteis. */
export function parseEcbRates(xml: string): { date: string; rates: Record<string, number> } {
  const date = xml.match(/time=['"](\d{4}-\d{2}-\d{2})['"]/)?.[1];
  if (!date) throw new Error("Resposta do BCE sem data");
  const rates: Record<string, number> = {};
  for (const m of xml.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([\d.]+)['"]/g)) rates[m[1]] = Number(m[2]);
  for (const c of ["USD", "JPY", "GBP", "CHF", "CAD", "AUD", "NZD"]) if (!(rates[c] > 0)) throw new Error(`Falta a taxa EUR/${c} no BCE`);
  return { date, rates };
}
