import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Política de segurança de conteúdo (D67): só recursos do próprio site.
 * Variante "sem nonces" (compatível com páginas pré-geradas). 'unsafe-inline' é necessário para os scripts
 * de arranque do Next.js e para estilos inline (React e o gráfico).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  poweredByHeader: false,
  // Capturas de ecrã do diário: reduzidas no browser antes do envio (a Vercel aceita no máximo 4,5 MB por pedido).
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
  // Cabeçalhos de segurança em todas as respostas.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" }, // impede que a app seja embutida noutro site
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
