import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: { default: "FX Market Drivers Pro", template: "%s · FX Market Drivers Pro" },
  description: "Contexto macro, técnica e gestão de risco para operar Forex com método.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0b0f14",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-PT" className={`${inter.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <TopBar />
        <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-5 px-4 pt-7 pb-28 sm:px-8 md:pb-10">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
