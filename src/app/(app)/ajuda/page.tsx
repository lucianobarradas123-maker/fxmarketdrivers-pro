import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Disclaimer, PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Ajuda" };

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-3">
      <h2 id={id} className="text-lg font-semibold">
        {title}
      </h2>
      <div className="flex flex-col gap-3 text-[14px] leading-relaxed text-ink-2">{children}</div>
    </Card>
  );
}

function Table({ head, rows }: { head: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-[13px]">
        <thead>
          <tr className="text-left text-xs text-faint">
            {head.map((h) => (
              <th key={h} className="py-1.5 pr-3 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-line-soft align-top">
              {r.map((c, j) => (
                <td key={j} className={`py-2 pr-3 ${j === 0 ? "font-semibold text-ink" : ""}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const L = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="text-up-soft hover:text-ink">
    {children}
  </Link>
);

export default function AjudaPage() {
  return (
    <>
      <PageHeader title="Ajuda" subtitle="Perceber o contexto, controlar o risco, registar e aprender." />
      <nav aria-label="Secções da ajuda" className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
        {[
          ["rotina", "Rotina sugerida"],
          ["indicadores", "Como ler os indicadores"],
          ["dados", "De onde vêm os dados"],
          ["custos", "Custos e limites"],
          ["seguranca", "Segurança e cópias"],
          ["problemas", "Se algo falhar"],
        ].map(([id, t]) => (
          <a key={id} href={`#${id}`} className="text-up-soft hover:text-ink">
            {t}
          </a>
        ))}
      </nav>

      <Section id="rotina" title="Rotina sugerida">
        <p>
          <strong className="text-ink">Ao domingo (10–15 min)</strong>
        </p>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5">
          <li>
            <L href="/calendario">Calendário</L>: regista os eventos de alto impacto da semana (e os de médio impacto das moedas que vais operar).
          </li>
          <li>
            <L href="/macro">Macro</L>: revê a força das moedas. Depois de cada reunião de banco central, analisa o comunicado ou o discurso com IA e decide se
            atualizas a tua leitura (botão &quot;Editar leitura&quot; ou &quot;Aplicar sugestão&quot;).
          </li>
          <li>Painel: vê os pares em destaque — são o ponto de partida para a semana.</li>
        </ol>
        <p>
          <strong className="text-ink">Antes de cada operação</strong>
        </p>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5">
          <li>
            <L href="/pares">Pares</L>: direção no H4, entrada no H1 (EMA 8/21, suportes e resistências).
          </li>
          <li>
            <L href="/pre-operacao">Pré-operação</L>: stop (≥ 0,5× ATR), alvo, lotes e a checklist do teu plano. Atenção aos avisos de notícias e de sentimento.
          </li>
          <li>Entra no MetaTrader e carrega em &quot;Registar no diário&quot; com o preço real de entrada (e a captura do gráfico, se quiseres).</li>
        </ol>
        <p>
          <strong className="text-ink">Depois de sair</strong>: no <L href="/diario">Diário</L>, &quot;Fechar operação&quot; com o preço de saída, se seguiste o plano e o
          que aprendeste.
        </p>
        <p>
          <strong className="text-ink">Uma vez por mês</strong>: atualiza o saldo da conta (Diário → Definições), exporta uma cópia de segurança (
          <L href="/conta">Conta</L>) e, a partir de ~50 operações, estuda as estatísticas do diário.
        </p>
      </Section>

      <Section id="indicadores" title="Como ler os indicadores">
        <Table
          head={["Indicador", "O que mede", "Como usar"]}
          rows={[
            ["Força macro (−3 a +3)", "Dados oficiais (juro, inflação vs. meta, emprego) + a tua leitura do banco central + sentimento de risco.", "Conta a diferença entre as duas moedas do par: quanto maior, mais forte o viés."],
            ["Viés do par", "Altista / baixista / neutro, a partir da diferença de força (≥ 1 ponto).", "Contexto de fundo, não um sinal de entrada."],
            ["Alinhamento", "Viés macro vs. tendência técnica.", "“Alinhado” = macro e técnica no mesmo sentido; “Conflito” = cuidado."],
            ["Tendência (EMA 8/21)", "Preço > EMA 8 > EMA 21 = ascendente (e o inverso).", "H4 para a direção, H1 para a entrada."],
            ["ATR", "Amplitude média de 14 velas, em pips.", "Stop abaixo de 0,5× ATR (diário) costuma ser apanhado pelo ruído."],
            ["Sentimento de risco (0–100)", "VIX, S&P 500, AUD/JPY e ouro face à média de 50 dias.", "Medo favorece JPY, CHF e USD; ganância favorece AUD, NZD e CAD."],
            ["Retalho", "% de traders de retalho comprados/vendidos (Myfxbook).", "Útil em extremos (≥ 70%): estar do lado contrário costuma ser melhor."],
            ["R", "Resultado em múltiplos do risco.", "+1R = ganhaste o que arriscaste. Permite comparar operações de tamanhos diferentes."],
          ]}
        />
      </Section>

      <Section id="dados" title="De onde vêm os dados">
        <Table
          head={["Dado", "Fonte", "Atualização", "Nota"]}
          rows={[
            ["Inflação e desemprego", "OCDE", "Automática, segundas e quintas", "Publicados com 1–3 meses de atraso; a app marca “ANTIGO” se > 4 meses."],
            ["Taxas e leitura dos bancos centrais", "Tu (manual)", "Após cada reunião", "Podes usar a análise de IA como apoio."],
            ["Preços (D1, H4, H1)", "Twelve Data", "D1 diária; H4/H1 a cada ~15 min", "Não são os preços da IC Markets (diferenças pequenas)."],
            ["Conversão do pip para EUR", "BCE (taxas de referência)", "Diária (~16h CET)", "Diferença tipicamente < 0,2% no valor do pip."],
            ["VIX", "CBOE", "Diária", "Parte do sentimento de risco."],
            ["Retalho", "Myfxbook", "Cache de 1 hora", "Contas de retalho ligadas ao Myfxbook."],
            ["Eventos", "Tu (manual)", "Semanal", "Lista pré-definida por moeda."],
          ]}
        />
      </Section>

      <Section id="custos" title="Custos e limites">
        <Table
          head={["Serviço", "Para quê", "Custo", "Limites a conhecer"]}
          rows={[
            ["Vercel (Hobby)", "Alojamento da app", "Grátis", "Só para uso pessoal e não comercial."],
            ["Supabase (Free)", "Base de dados, login, capturas", "Grátis", "500 MB de dados, 1 GB de imagens; sem cópias recuperáveis (exporta tu); pausa após 7 dias sem uso (evitado por uma tarefa automática)."],
            ["Twelve Data (Basic)", "Preços", "Grátis", "8 pedidos/min e 800/dia (a app usa cache; se o limite for atingido, tenta de novo sozinha)."],
            ["OCDE, BCE, CBOE", "Macro, conversão, VIX", "Grátis", "—"],
            ["Myfxbook", "Sentimento do retalho", "Grátis", "Usa as credenciais da tua conta Myfxbook (guardadas só na Vercel)."],
            ["Anthropic (Claude)", "Análise de discursos", "Pago por uso: ~0,05–0,30 $ por análise", "Respeita o limite mensal que definiste na consola da Anthropic."],
            ["GitHub", "Código e tarefas automáticas", "Grátis", "—"],
          ]}
        />
        <p>Custo mensal típico: só a IA — com 10 a 20 análises por mês, menos de 3 €.</p>
      </Section>

      <Section id="seguranca" title="Segurança e cópias de segurança">
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>A tua conta tem verificação em dois passos (2FA). Guarda o acesso à app de autenticação num sítio seguro.</li>
          <li>A app nunca guarda credenciais da IC Markets nem do MetaTrader.</li>
          <li>
            Exporta os teus dados uma vez por mês (<L href="/conta">Conta → Cópias de segurança</L>). O painel lembra-te se passar mais de um mês.
          </li>
          <li>Nunca partilhes chaves (Anthropic, Twelve Data, Myfxbook) em mensagens — estão guardadas como segredos na Vercel.</li>
        </ul>
      </Section>

      <Section id="problemas" title="Se algo falhar">
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>“Limite de pedidos por minuto”: espera 1 minuto — a app tenta de novo sozinha.</li>
          <li>Um bloco aparece como “indisponível”: a fonte externa falhou; a app continua a funcionar sem esse componente e volta a tentar em minutos.</li>
          <li>Página de erro com código: carrega em “Tentar de novo”; se persistir, guarda o código para diagnóstico.</li>
          <li>Dados macro com etiqueta “ANTIGO”: a OCDE ainda não publicou dados recentes dessa economia (é normal no desemprego suíço).</li>
        </ul>
      </Section>

      <Disclaimer source="FX Market Drivers Pro — aplicação pessoal" />
    </>
  );
}
