export function PageHeader({ title, subtitle, aside }: { title: string; subtitle?: React.ReactNode; aside?: React.ReactNode }) {
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

export function Disclaimer({ source = "Macro: OCDE + as tuas leituras · Preços: Twelve Data · Sentimento: CBOE, Myfxbook · Eventos: o teu calendário" }: { source?: string }) {
  return (
    <footer className="flex flex-wrap justify-between gap-2 border-t border-line-soft pt-3 text-xs text-faint">
      <span>Informação e análise para apoio à decisão. Não é aconselhamento financeiro nem garante resultados. A decisão é sempre tua.</span>
      <span>{source}</span>
    </footer>
  );
}
