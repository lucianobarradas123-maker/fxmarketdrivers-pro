export function PageHeader({ title, subtitle, aside }: { title: string; subtitle?: string; aside?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {aside}
    </div>
  );
}

export function SampleNotice() {
  return (
    <p className="rounded-md border border-dashed border-down-line px-2.5 py-1.5 text-xs text-down-soft">
      Etapa 0 · todos os valores são de exemplo, não dados reais
    </p>
  );
}

export function Disclaimer() {
  return (
    <footer className="flex flex-wrap justify-between gap-2 border-t border-line-soft pt-3 text-xs text-faint">
      <span>Informação e análise para apoio à decisão. Não é aconselhamento financeiro nem garante resultados. A decisão é sempre tua.</span>
      <span>Fonte atual: dados de exemplo</span>
    </footer>
  );
}
