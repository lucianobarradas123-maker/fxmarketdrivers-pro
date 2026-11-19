-- Histórico diário da força macro de cada moeda (D73). Um registo por utilizador, dia e moeda
-- (o último do dia prevalece). Depende das leituras do utilizador, por isso é por utilizador.
create table public.historico_forca (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dia date not null,
  moeda text not null check (moeda in ('USD','EUR','GBP','JPY','CHF','CAD','AUD','NZD')),
  total numeric(4, 1) not null check (total between -3 and 3),
  dados numeric(4, 1) not null,
  banco numeric(3, 1) not null,
  risco numeric(4, 2) not null,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, dia, moeda)
);

alter table public.historico_forca enable row level security;
revoke all on public.historico_forca from anon;

create policy "historico: só o dono, com sessão segura" on public.historico_forca for all to authenticated
  using (user_id = (select auth.uid()) and (select privado.sessao_segura()))
  with check (user_id = (select auth.uid()) and (select privado.sessao_segura()));
