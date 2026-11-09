import { describe, expect, it } from "vitest";
import { htmlToText, isSafeUrl, quoteAppears } from "./text";

describe("links seguros", () => {
  it("aceita https públicos", () => {
    expect(isSafeUrl("https://www.ecb.europa.eu/press/key/date/2026/html/ecb.sp261105.en.html")).toBe(true);
    expect(isSafeUrl("https://www.federalreserve.gov/newsevents/speech/waller20261105a.htm")).toBe(true);
  });
  it("recusa http, IPs, localhost, redes internas e credenciais no link", () => {
    for (const u of [
      "http://www.ecb.europa.eu/x",
      "https://127.0.0.1/x",
      "https://169.254.169.254/latest/meta-data",
      "https://[::1]/x",
      "https://localhost/x",
      "https://intranet/x",
      "https://servidor.internal/x",
      "https://user:pass@site.com/x",
      "ftp://site.com/x",
      "não é um link",
    ])
      expect(isSafeUrl(u)).toBe(false);
  });
});

describe("HTML → texto", () => {
  it("remove scripts, estilos e marcas, mantém o texto", () => {
    const t = htmlToText("<html><script>x=1</script><style>p{}</style><p>Inflation remains&nbsp;too high.</p><p>We will act.</p></html>");
    expect(t).toContain("Inflation remains too high.");
    expect(t).toContain("We will act.");
    expect(t).not.toContain("x=1");
  });
});

describe("verificação de citações", () => {
  const text = "Inflation remains too high. We are prepared to raise rates further if needed — the labour market is still tight.";
  it("encontra citação literal (ignora maiúsculas, aspas e espaços)", () => {
    expect(quoteAppears("“We are prepared to raise rates further if needed”", text)).toBe(true);
    expect(quoteAppears("inflation   remains too high.", text)).toBe(true);
  });
  it("aceita travessões diferentes", () => {
    expect(quoteAppears("if needed - the labour market is still tight", text)).toBe(true);
  });
  it("aceita reticências se as partes existirem pela ordem", () => {
    expect(quoteAppears("Inflation remains too high... the labour market is still tight", text)).toBe(true);
    expect(quoteAppears("the labour market is still tight... Inflation remains too high", text)).toBe(false);
  });
  it("rejeita frases inventadas ou demasiado curtas", () => {
    expect(quoteAppears("We will cut rates next month", text)).toBe(false);
    expect(quoteAppears("too high", text)).toBe(false);
  });
});
