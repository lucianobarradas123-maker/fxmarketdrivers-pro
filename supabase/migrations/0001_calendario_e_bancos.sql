-- Etapa 2 — Calendário económico e leituras dos bancos centrais
-- Regras de segurança (RLS): cada linha pertence a um utilizador e só ele a pode ler ou alterar.
-- Se o utilizador tiver 2FA configurada, a sessão tem de estar verificada com o código (aal2).

-- Função auxiliar: a sessão atual cumpre o nível de segurança exigido?
-- Sem fator 2FA verificado → basta a palavra-passe (aal1). Com fator → exige aal2.
create or replace function public.sessao_segura()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce((auth.jwt() ->> 'aal') = 'aal2', false)
    or not exists (
      select 1 from auth.mfa_factors f
      where f.user_id = (select auth.uid()) and f.status = 'verified'
    );
$$;

revoke all on function public.sessao_segura() from public, anon;
grant execute on function public.sessao_segura() to authenticated;

-- Eventos económicos registados manualmente (D20)
create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data_hora timestamptz not null,
  moeda text not null check (moeda in ('USD','EUR','GBP','JPY','CHF','CAD','AUD','NZD')),
  nome text not null check (char_length(nome) between 2 and 120),
  impacto text not null check (impacto in ('alto','médio','baixo')),
  previsao text check (char_length(previsao) <= 30),
  anterior text check (char_length(anterior) <= 30),
  atual text check (char_length(atual) <= 30),
  notas text check (char_length(notas) <= 500),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index eventos_user_data_idx on public.eventos (user_id, data_hora);

-- Leitura manual da postura de cada banco central (D11, D24). Substitui o valor do ficheiro quando existe.
create table public.leituras_bancos (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  moeda text not null check (moeda in ('USD','EUR','GBP','JPY','CHF','CAD','AUD','NZD')),
  postura text not null check (postura in ('Restritivo','Lig. restritivo','Neutro','Lig. expansionista','Expansionista')),
  justificacao text not null check (char_length(justificacao) between 2 and 500),
  atualizado_em timestamptz not null default now(),
  primary key (user_id, moeda)
);

-- Atualiza "atualizado_em" automaticamente
create or replace function public.tocar_atualizado_em()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger eventos_atualizado before update on public.eventos
  for each row execute function public.tocar_atualizado_em();
create trigger leituras_atualizado before update on public.leituras_bancos
  for each row execute function public.tocar_atualizado_em();

-- Segurança ao nível da linha
alter table public.eventos enable row level security;
alter table public.leituras_bancos enable row level security;

-- Visitantes sem login não têm acesso nenhum
revoke all on public.eventos, public.leituras_bancos from anon;

create policy "eventos: só o dono, com sessão segura" on public.eventos
  for all to authenticated
  using (user_id = (select auth.uid()) and (select public.sessao_segura()))
  with check (user_id = (select auth.uid()) and (select public.sessao_segura()));

create policy "leituras: só o dono, com sessão segura" on public.leituras_bancos
  for all to authenticated
  using (user_id = (select auth.uid()) and (select public.sessao_segura()))
  with check (user_id = (select auth.uid()) and (select public.sessao_segura()));
