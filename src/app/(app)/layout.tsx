import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <TopBar />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-5 px-4 pt-7 pb-28 sm:px-8 md:pb-10">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
