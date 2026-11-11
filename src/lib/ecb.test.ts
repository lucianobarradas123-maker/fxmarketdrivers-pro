import { describe, expect, it } from "vitest";
import { parseEcbRates } from "./ecb";

const XML = `<gesmes:Envelope><Cube><Cube time='2026-11-11'>
<Cube currency='USD' rate='1.1127'/><Cube currency='JPY' rate='177.18'/><Cube currency='GBP' rate='0.83618'/>
<Cube currency='CHF' rate='0.9234'/><Cube currency='AUD' rate='1.6222'/><Cube currency='CAD' rate='1.5839'/><Cube currency='NZD' rate='1.9928'/>
</Cube></Cube></gesmes:Envelope>`;

describe("taxas do BCE", () => {
  it("lê a data e as 7 taxas", () => {
    const r = parseEcbRates(XML);
    expect(r.date).toBe("2026-11-11");
    expect(r.rates.USD).toBe(1.1127);
    expect(r.rates.JPY).toBe(177.18);
  });
  it("falha se faltar uma moeda", () => {
    expect(() => parseEcbRates(XML.replace(/<Cube currency='NZD'[^>]+>/, ""))).toThrow(/NZD/);
  });
});
