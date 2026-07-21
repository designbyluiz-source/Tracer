-- =============================================================================
-- Usuário de teste do Tracer
--   Email: operations@tracer.local
--   Senha: tracer123
-- Rodar no SQL Editor do Supabase, DEPOIS das migrations 0001 e 0002.
-- (Alternativa mais simples: Authentication > Users > Add user, com Auto Confirm.)
-- =============================================================================

do $$
declare
  uid uuid := gen_random_uuid();
begin
  -- Não recria se já existir.
  if exists (select 1 from auth.users where email = 'operations@tracer.local') then
    raise notice 'Usuário operations@tracer.local já existe. Nada a fazer.';
    return;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
    'operations@tracer.local', crypt('tracer123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    '', '', '', ''
  );

  -- Identidade de email (necessária para login por senha em versões recentes).
  insert into auth.identities (
    provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    'operations@tracer.local', uid,
    jsonb_build_object('sub', uid::text, 'email', 'operations@tracer.local'),
    'email', now(), now(), now()
  );

  -- Garante o profile (o trigger já faz isso, mas reforçamos por segurança).
  insert into public.profiles (id, email, area)
  values (uid, 'operations@tracer.local', 'Operations')
  on conflict (id) do nothing;

  raise notice 'Usuário de teste criado: operations@tracer.local / tracer123';
end $$;
