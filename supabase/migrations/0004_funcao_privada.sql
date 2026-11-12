-- Fase 6 — Segurança: a função que verifica a 2FA passa para um esquema privado (não exposto pela API REST).
-- Aviso do Supabase: "authenticated_security_definer_function_executable".
create schema if not exists privado;
revoke all on schema privado from public, anon;
grant usage on schema privado to authenticated;

create or replace function privado.sessao_segura()
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
revoke all on function privado.sessao_segura() from public, anon;
grant execute on function privado.sessao_segura() to authenticated;

-- Recria as regras a usar a função privada
drop policy "eventos: só o dono, com sessão segura" on public.eventos;
create policy "eventos: só o dono, com sessão segura" on public.eventos for all to authenticated
  using (user_id = (select auth.uid()) and (select privado.sessao_segura()))
  with check (user_id = (select auth.uid()) and (select privado.sessao_segura()));

drop policy "leituras: só o dono, com sessão segura" on public.leituras_bancos;
create policy "leituras: só o dono, com sessão segura" on public.leituras_bancos for all to authenticated
  using (user_id = (select auth.uid()) and (select privado.sessao_segura()))
  with check (user_id = (select auth.uid()) and (select privado.sessao_segura()));

drop policy "operacoes: só o dono, com sessão segura" on public.operacoes;
create policy "operacoes: só o dono, com sessão segura" on public.operacoes for all to authenticated
  using (user_id = (select auth.uid()) and (select privado.sessao_segura()))
  with check (user_id = (select auth.uid()) and (select privado.sessao_segura()));

drop policy "definicoes: só o dono, com sessão segura" on public.definicoes_conta;
create policy "definicoes: só o dono, com sessão segura" on public.definicoes_conta for all to authenticated
  using (user_id = (select auth.uid()) and (select privado.sessao_segura()))
  with check (user_id = (select auth.uid()) and (select privado.sessao_segura()));

drop policy "capturas: ler só as próprias" on storage.objects;
create policy "capturas: ler só as próprias" on storage.objects for select to authenticated
  using (bucket_id = 'capturas' and (storage.foldername(name))[1] = (select auth.uid())::text and (select privado.sessao_segura()));
drop policy "capturas: enviar só para a própria pasta" on storage.objects;
create policy "capturas: enviar só para a própria pasta" on storage.objects for insert to authenticated
  with check (bucket_id = 'capturas' and (storage.foldername(name))[1] = (select auth.uid())::text and (select privado.sessao_segura()));
drop policy "capturas: apagar só as próprias" on storage.objects;
create policy "capturas: apagar só as próprias" on storage.objects for delete to authenticated
  using (bucket_id = 'capturas' and (storage.foldername(name))[1] = (select auth.uid())::text and (select privado.sessao_segura()));

drop function public.sessao_segura();
