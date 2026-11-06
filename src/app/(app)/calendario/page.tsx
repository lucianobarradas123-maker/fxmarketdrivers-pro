import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Countdown } from "@/components/ui/Countdown";
import { Disclaimer, PageHeader } from "@/components/ui/PageHeader";
import { getEvents, type EventRow } from "@/lib/events";
import { dayKey, formatDay, formatTime } from "@/lib/time";
import { ActualForm } from "./ActualForm";
import { AddEventForm } from "./AddEventForm";
import { deleteEvent } from "./actions";

export const metadata: Metadata = { title: "Calendário" };

const IMPACT_STYLE = {
  alto: "text-down border-down-line bg-down/10",
  médio: "text-ink-2 border-line-strong",
  baixo: "text-faint border-line-soft",
} as const;

function EventItem({ e, past }: { e: EventRow; past: boolean }) {
  return (
    <li className={`flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line-soft py-3 ${past ? "opacity-75" : ""}`}>
      <span className="num w-12 text-[13px] text-muted">{formatTime(e.data_hora)}</span>
      <span className="num w-10 text-[13px] font-semibold">{e.moeda}</span>
      <span className="min-w-40 flex-[1_1_220px]">{e.nome}</span>
      <span className={`rounded border px-2 py-px text-[11px] font-semibold uppercase ${IMPACT_STYLE[e.impacto]}`}>{e.impacto}</span>
      <dl className="num flex gap-4 text-[13px]">
        <div className="flex flex-col">
          <dt className="text-[11px] text-faint">Previsão</dt>
          <dd>{e.previsao ?? "—"}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-[11px] text-faint">Anterior</dt>
          <dd>{e.anterior ?? "—"}</dd>
        </div>
      </dl>
      <ActualForm id={e.id} value={e.atual} label={`${e.moeda} ${e.nome}`} />
      <form action={deleteEvent}>
        <input type="hidden" name="id" value={e.id} />
        <button
          type="submit"
          aria-label={`Apagar ${e.moeda} ${e.nome}`}
          className="grid size-9 cursor-pointer place-items-center rounded-md text-faint hover:bg-surface-2 hover:text-down-soft"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </form>
    </li>
  );
}

async function EventsList() {
  const { now, events } = await getEvents(7, 28);
  const next = events.find((e) => e.impacto === "alto" && new Date(e.data_hora).getTime() > now);

  if (events.length === 0) {
    return (
      <Card className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">Ainda não há eventos</h2>
        <p className="text-[13px] text-ink-2">
          Ao domingo, abre um calendário económico de referência e regista aqui os eventos de alto impacto da semana para as moedas que acompanhas. Demora cerca de 10 minutos.
        </p>
      </Card>
    );
  }

  const days = new Map<string, EventRow[]>();
  for (const e of events) days.set(dayKey(e.data_hora), [...(days.get(dayKey(e.data_hora)) ?? []), e]);
  const today = dayKey(new Date(now).toISOString());

  return (
    <>
      {next && (
        <Card className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="text-xs tracking-wider text-muted uppercase">Próximo evento de alto impacto</span>
          <span className="font-semibold">
            <span className="num">{next.moeda}</span> · {next.nome}
          </span>
          <Countdown to={next.data_hora} initialNow={now} className="num text-xl font-semibold text-down" />
        </Card>
      )}
      <Card className="flex flex-col gap-4">
        <CardHeader id="eventos" title="Eventos" tag="informacao" aside="Últimos 7 dias e próximas 4 semanas" />
        {[...days.entries()].map(([day, list]) => (
          <section key={day} aria-label={formatDay(list[0].data_hora)}>
            <h3 className={`text-[13px] font-semibold capitalize ${day === today ? "text-up-soft" : "text-ink-2"}`}>
              {day === today ? "Hoje · " : ""}
              {formatDay(list[0].data_hora)}
            </h3>
            <ul>
              {list.map((e) => (
                <EventItem key={e.id} e={e} past={new Date(e.data_hora).getTime() < now} />
              ))}
            </ul>
          </section>
        ))}
      </Card>
    </>
  );
}

export default function CalendarioPage() {
  return (
    <>
      <PageHeader title="Calendário" subtitle="Eventos económicos que registas manualmente · horas de Lisboa" />
      <Card className="flex flex-col gap-4">
        <CardHeader
          id="novo"
          title="Adicionar evento"
          help="Escolhe a moeda e o evento da lista; o impacto é preenchido automaticamente. Previsão e valor anterior são opcionais. Depois de o dado sair, regista o valor real na lista abaixo."
        />
        <AddEventForm />
      </Card>
      <Suspense fallback={<Card><p className="text-muted">A carregar eventos…</p></Card>}>
        <EventsList />
      </Suspense>
      <Disclaimer source="Fonte: eventos inseridos manualmente pelo utilizador" />
    </>
  );
}
