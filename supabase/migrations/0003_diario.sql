-- Etapa 4 — Diário de operações (D57–D60)

-- Definições da conta (substitui o saldo/risco guardados só no dispositivo)
create table public.definicoes_conta (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  saldo numeric(14, 2) not null check (saldo > 0 and saldo < 100000000),
  risco_pct numeric(5, 2) not null check (risco_pct > 0 and risco_pct <= 10),
  moeda_conta text not null default 'EUR' check (moeda_conta = 'EUR'),
  atualizado_em timestamptz not null default now()
);

-- Operações
create table public.operacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  estado text not null default 'aberta' check (estado in ('aberta', 'fechada')),
  par text not null check (par ~ '^[A-Z]{3}/[A-Z]{3}$'),
  direcao text not null check (direcao in ('compra', 'venda')),
  estrategia text not null check (char_length(estrategia) between 2 and 60),
  emocao text not null check (char_length(emocao) between 2 and 60),
  motivo text check (char_length(motivo) <= 2000),
  aberta_em timestamptz not null default now(),
  preco_entrada numeric(14, 6) not null check (preco_entrada > 0),
  stop_pips numeric(8, 1) not null check (stop_pips > 0),
  alvo_pips numeric(8, 1) check (alvo_pips > 0),
  lotes numeric(8, 2) not null check (lotes > 0),
  valor_pip_eur numeric(10, 4) not null check (valor_pip_eur > 0),
  risco_eur numeric(14, 2) not null check (risco_eur > 0),
  saldo_na_entrada numeric(14, 2) check (saldo_na_entrada > 0),
  contexto jsonb not null default '{}'::jsonb,   -- macro, técnica, sentimento, retalho, eventos no momento da entrada
  checklist jsonb not null default '[]'::jsonb,  -- critérios do plano e o seu estado no momento da entrada
  captura_path text check (char_length(captura_path) <= 300),
  fechada_em timestamptz,
  preco_saida numeric(14, 6) check (preco_saida > 0),
  resultado_pips numeric(10, 1),
  resultado_r numeric(8, 2),
  resultado_eur numeric(14, 2),
  seguiu_plano boolean,
  licoes text check (char_length(licoes) <= 2000),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  -- Uma operação fechada tem de ter os dados de saída
  check (estado = 'aberta' or (fechada_em is not null and preco_saida is not null and resultado_r is not null and seguiu_plano is not null))
);

create index operacoes_user_aberta_idx on public.operacoes (user_id, aberta_em desc);

create trigger operacoes_atualizado before update on public.operacoes
  for each row execute function public.tocar_atualizado_em();
create trigger definicoes_atualizado before update on public.definicoes_conta
  for each row execute function public.tocar_atualizado_em();

alter table public.operacoes enable row level security;
alter table public.definicoes_conta enable row level security;
revoke all on public.operacoes, public.definicoes_conta from anon;

create policy "operacoes: só o dono, com sessão segura" on public.operacoes
  for all to authenticated
  using (user_id = (select auth.uid()) and (select public.sessao_segura()))
  with check (user_id = (select auth.uid()) and (select public.sessao_segura()));

create policy "definicoes: só o dono, com sessão segura" on public.definicoes_conta
  for all to authenticated
  using (user_id = (select auth.uid()) and (select public.sessao_segura()))
  with check (user_id = (select auth.uid()) and (select public.sessao_segura()));

-- Capturas de ecrã: espaço PRIVADO; cada utilizador só acede à sua pasta (<user_id>/...)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('capturas', 'capturas', false, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "capturas: ler só as próprias" on storage.objects
  for select to authenticated
  using (bucket_id = 'capturas' and (storage.foldername(name))[1] = (select auth.uid())::text and (select public.sessao_segura()));

create policy "capturas: enviar só para a própria pasta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'capturas' and (storage.foldername(name))[1] = (select auth.uid())::text and (select public.sessao_segura()));

create policy "capturas: apagar só as próprias" on storage.objects
  for delete to authenticated
  using (bucket_id = 'capturas' and (storage.foldername(name))[1] = (select auth.uid())::text and (select public.sessao_segura()));
