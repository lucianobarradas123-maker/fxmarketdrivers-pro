"use client";

/** Último recurso (falha no próprio esqueleto da app): HTML mínimo, sem dependências. */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="pt-PT">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#0b0f14", color: "#e7ecf2", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 20 }}>A aplicação encontrou um erro</h1>
          <p style={{ color: "#a7b1bd" }}>Tenta de novo dentro de momentos.</p>
          <button type="button" onClick={() => retry()} style={{ minHeight: 44, padding: "0 16px", borderRadius: 8, border: 0, background: "#5aa9ff", color: "#0b0f14", fontWeight: 600, cursor: "pointer" }}>
            Tentar de novo
          </button>
        </main>
      </body>
    </html>
  );
}
