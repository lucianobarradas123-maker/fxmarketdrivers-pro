import { Suspense } from "react";
import { BottomNav, BottomNavView } from "@/components/layout/BottomNav";
import { TopBar, TopBarView } from "@/components/layout/TopBar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* Suspense: em páginas com partes variáveis no endereço (ex.: /calendario/[id]) o menu espera pelo endereço. */}
      <Suspense fallback={<TopBarView pathname="" />}>
        <TopBar />
      </Suspense>
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-5 px-4 pt-7 pb-28 sm:px-8 md:pb-10">
        {children}
      </main>
      <Suspense fallback={<BottomNavView pathname="" />}>
        <BottomNav />
      </Suspense>
    </>
  );
}
