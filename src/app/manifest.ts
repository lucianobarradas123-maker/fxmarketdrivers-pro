import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FX Market Drivers Pro",
    short_name: "FX Drivers",
    description: "Contexto macro, técnica e gestão de risco para operar Forex com método.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0f14",
    theme_color: "#0b0f14",
    lang: "pt-PT",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
