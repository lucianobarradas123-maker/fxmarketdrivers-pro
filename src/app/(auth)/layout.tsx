import { Logo } from "@/components/ui/Icon";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="fade-in flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center gap-2.5">
          <Logo />
          <span className="text-lg font-bold tracking-tight">FX Market Drivers</span>
          <span className="num rounded border border-up-line px-1.5 text-[11px] font-semibold text-up-soft">PRO</span>
        </div>
        <div className="rounded-xl border border-line bg-surface p-6">{children}</div>
        <p className="text-center text-xs text-faint">Aplicação pessoal e privada. Ligação cifrada; dados protegidos por utilizador.</p>
      </div>
    </main>
  );
}
