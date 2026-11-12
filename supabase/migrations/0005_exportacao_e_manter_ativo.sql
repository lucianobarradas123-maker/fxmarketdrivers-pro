-- Fase 7 — cópias de segurança e manter o projeto ativo (D69, D70)

-- Data da última exportação dos dados (para o lembrete mensal no painel)
alter table public.definicoes_conta add column ultima_exportacao timestamptz;

-- Função mínima chamada pela tarefa automática do GitHub para o projeto gratuito não ser pausado por inatividade.
-- Não lê nem devolve dados: só "1".
create or replace function public.manter_ativo()
returns integer
language sql
stable
security invoker
set search_path = ''
as $$ select 1 $$;
revoke all on function public.manter_ativo() from public;
grant execute on function public.manter_ativo() to anon, authenticated;
