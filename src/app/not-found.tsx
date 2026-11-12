import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <p className="num text-5xl font-semibold text-faint">404</p>
        <h1 className="text-xl font-bold">Página não encontrada</h1>
        <p className="text-[14px] text-ink-2">O endereço não existe ou o evento/operação já foi apagado.</p>
        <Link href="/" className="inline-flex min-h-11 items-center rounded-lg bg-up px-4 font-semibold text-bg hover:opacity-90">
          Voltar ao painel
        </Link>
      </div>
    </main>
  );
}
