-- Análise de discursos e comunicados com IA (D51).
-- As colunas novas ficam na tabela "eventos", por isso herdam as regras de segurança (RLS) existentes.
alter table public.eventos
  add column texto text check (char_length(texto) <= 200000),
  add column fonte_url text check (fonte_url ~ '^https://' and char_length(fonte_url) <= 2000),
  add column analise jsonb,
  add column analisado_em timestamptz,
  add column analise_modelo text check (char_length(analise_modelo) <= 60);
