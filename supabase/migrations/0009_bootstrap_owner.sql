-- 0009_bootstrap_owner.sql
-- Bootstrap the first Owner account.
-- This migration runs with elevated (service-role) privileges via apply_migration,
-- bypassing RLS. Required because the employees_insert policy requires
-- get_my_role() = 'owner', but no owner exists yet (chicken-and-egg).
--
-- Owner email: fitmantrabyamanatkagzi@gmail.com
-- is_first_login = true → will be forced to set a new password on first login.

-- Step 1: Create auth.users entry.
-- The password is set via a separate admin API call outside this migration
-- because auth.users password hashing cannot be done in plain SQL safely.
-- Instead, we insert a placeholder auth row and immediately link it.

-- We use a DO block so we can capture the generated auth UUID and reuse it.
do $$
declare
  owner_auth_id uuid;
begin
  -- Check if this owner already exists (idempotency guard)
  select id into owner_auth_id
  from auth.users
  where email = 'fitmantrabyamanatkagzi@gmail.com';

  if owner_auth_id is not null then
    -- Owner auth account already exists; ensure employees row exists too
    if not exists (select 1 from public.employees where auth_id = owner_auth_id) then
      insert into public.employees (
        auth_id, employee_code, first_name, last_name, email, role,
        employment_type, employment_status, join_date, is_first_login, is_active
      ) values (
        owner_auth_id, 'EMP-2026-0001', 'Amanat', 'Kagzi',
        'fitmantrabyamanatkagzi@gmail.com', 'owner',
        'full_time', 'active', current_date, true, true
      );
    end if;
    return;
  end if;

  -- Create the auth user
  insert into auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(), 'authenticated', 'authenticated',
    'fitmantrabyamanatkagzi@gmail.com',
    crypt('owner@123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"first_name":"Amanat","last_name":"Kagzi"}'::jsonb,
    now(), now(),
    '', '', '', ''
  )
  returning id into owner_auth_id;

  -- Also insert into auth.identities (required by Supabase Auth for email login)
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), owner_auth_id,
    'fitmantrabyamanatkagzi@gmail.com',
    jsonb_build_object(
      'sub', owner_auth_id::text,
      'email', 'fitmantrabyamanatkagzi@gmail.com',
      'email_verified', true,
      'phone_verified', false
    ),
    'email', now(), now(), now()
  );

  -- Step 2: Insert the Owner's employees row
  insert into public.employees (
    auth_id, employee_code, first_name, last_name, email, role,
    employment_type, employment_status, join_date, is_first_login, is_active
  ) values (
    owner_auth_id, 'EMP-2026-0001', 'Amanat', 'Kagzi',
    'fitmantrabyamanatkagzi@gmail.com', 'owner',
    'full_time', 'active', current_date, true, true
  );
end;
$$;
