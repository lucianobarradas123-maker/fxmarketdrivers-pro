do $$
declare
  a uuid := '11111111-1111-1111-1111-111111111111';
  b uuid := '22222222-2222-2222-2222-222222222222';
  r text := '';
  n int;
  ok boolean;
begin
  insert into auth.users (id, email, aud, role, instance_id) values
    (a, 'teste-a@exemplo.invalid', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
    (b, 'teste-b@exemplo.invalid', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000');

  -- Utilizador A (sem 2FA) cria um evento
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  insert into public.eventos (data_hora, moeda, nome, impacto) values (now(), 'USD', 'Payroll (NFP)', 'alto');
  select count(*) into n from public.eventos; r := r || 'A vê os seus=' || n;

  -- Utilizador B não vê nem altera os eventos de A
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  select count(*) into n from public.eventos; r := r || ' | B vê de A=' || n;
  update public.eventos set nome = 'alterado'; get diagnostics n = row_count; r := r || ' | B altera de A=' || n;
  delete from public.eventos; get diagnostics n = row_count; r := r || ' | B apaga de A=' || n;

  -- B não consegue criar um evento em nome de A
  begin
    insert into public.eventos (user_id, data_hora, moeda, nome, impacto) values (a, now(), 'EUR', 'X', 'alto');
    r := r || ' | B cria em nome de A=SIM(!)';
  exception when insufficient_privilege or check_violation then r := r || ' | B cria em nome de A=recusado';
  end;

  -- Visitante sem login
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin
    select count(*) into n from public.eventos; r := r || ' | anónimo vê=' || n;
  exception when insufficient_privilege then r := r || ' | anónimo=recusado';
  end;

  -- A com 2FA configurada mas sessão só com palavra-passe (aal1) → bloqueado; com aal2 → acesso
  perform set_config('role', 'postgres', true);
  insert into auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at)
    values (gen_random_uuid(), a, 'teste', 'totp', 'verified', now(), now());
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  select count(*) into n from public.eventos; r := r || ' | A 2FA sem código vê=' || n;
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  select count(*) into n from public.eventos; r := r || ' | A 2FA com código vê=' || n;

  -- Validação dos dados
  begin
    insert into public.eventos (data_hora, moeda, nome, impacto) values (now(), 'BTC', 'X', 'alto');
    r := r || ' | moeda inválida=aceite(!)';
  exception when check_violation then r := r || ' | moeda inválida=recusada';
  end;

  raise exception 'RESULTADO: %', r;  -- anula tudo o que foi feito
end $$;
