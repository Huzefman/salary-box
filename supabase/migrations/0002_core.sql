-- 0002_core.sql
-- Tables 1-3 (employees, departments, designations) + RLS helper functions
-- + generic updated_at trigger + RLS policies.
-- Source: docs/DATABASE_SCHEMA.md, docs/ROLE_RULES.md

-- ============================================================
-- Tables
-- ============================================================

create table departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references departments(id),
  depth smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  unique (name, parent_id)
);

create index idx_departments_parent_id on departments (parent_id);
create index idx_departments_is_active on departments (is_active);

create table designations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department_id uuid references departments(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, department_id)
);

create index idx_designations_department_id on designations (department_id);

create table employees (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid references auth.users(id),
  employee_code text not null unique,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  phone text,
  date_of_birth date,
  gender gender,
  photo_url text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  pincode text,
  emergency_contact_name text,
  emergency_contact_phone text,
  personal_email text,
  department_id uuid references departments(id),
  designation_id uuid references designations(id),
  reporting_manager_id uuid references employees(id),
  role user_role not null default 'employee',
  employment_type employment_type not null default 'full_time',
  employment_status employment_status not null default 'active',
  join_date date not null,
  exit_date date,
  probation_end_date date,
  current_salary numeric(12,2),
  previous_employee_id uuid references employees(id),
  is_first_login boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references employees(id),
  constraint employees_exit_after_join check (exit_date is null or exit_date > join_date)
);

create index idx_employees_auth_id on employees (auth_id);
create index idx_employees_department_id on employees (department_id);
create index idx_employees_reporting_manager_id on employees (reporting_manager_id);
create index idx_employees_role on employees (role);
create index idx_employees_employment_status on employees (employment_status);
create index idx_employees_is_active on employees (is_active);

-- departments.created_by -> employees.id (added now that employees exists)
alter table departments
  add constraint departments_created_by_fkey
  foreign key (created_by) references employees(id);

-- ============================================================
-- Helper functions for RLS
-- ============================================================

create or replace function get_my_role()
returns user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from employees where auth_id = auth.uid();
$$;

create or replace function get_my_employee_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from employees where auth_id = auth.uid();
$$;

-- ============================================================
-- Generic updated_at trigger
-- ============================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on departments
  for each row execute function set_updated_at();

create trigger set_updated_at
  before update on designations
  for each row execute function set_updated_at();

create trigger set_updated_at
  before update on employees
  for each row execute function set_updated_at();

-- ============================================================
-- RLS: departments
-- ============================================================

alter table departments enable row level security;

create policy departments_select on departments for select
using (
  get_my_role() in ('owner', 'hr', 'system_admin')
  or is_active = true
);

create policy departments_insert on departments for insert
with check (get_my_role() = 'owner');

create policy departments_update on departments for update
using (get_my_role() = 'owner')
with check (get_my_role() = 'owner');

-- ============================================================
-- RLS: designations
-- ============================================================

alter table designations enable row level security;

create policy designations_select on designations for select
using (
  get_my_role() in ('owner', 'hr', 'system_admin')
  or is_active = true
);

create policy designations_insert on designations for insert
with check (get_my_role() = 'owner');

create policy designations_update on designations for update
using (get_my_role() = 'owner')
with check (get_my_role() = 'owner');

-- ============================================================
-- RLS: employees
-- ============================================================

alter table employees enable row level security;

-- Owner: all rows. Self: own row always. HR/System Admin: active,
-- non-future-joiner rows (future joiners become visible on join_date).
create policy employees_select on employees for select
using (
  get_my_role() = 'owner'
  or auth_id = auth.uid()
  or (
    get_my_role() in ('hr', 'system_admin')
    and is_active = true
    and (employment_status != 'future_joiner' or join_date <= current_date)
  )
);

create policy employees_insert on employees for insert
with check (get_my_role() = 'owner');

create policy employees_update on employees for update
using (
  get_my_role() = 'owner'
  or (get_my_role() = 'hr' and is_active = true)
  or auth_id = auth.uid()
)
with check (
  get_my_role() = 'owner'
  or (get_my_role() = 'hr' and is_active = true)
  or auth_id = auth.uid()
);

-- No DELETE policy: soft delete via UPDATE is_active only.

-- Field-level update restrictions per ROLE_RULES.md (RLS cannot express
-- column-level checks, so enforce via trigger as a DB constraint).
create or replace function enforce_employee_update()
returns trigger
language plpgsql
as $$
declare
  my_role user_role := get_my_role();
begin
  if my_role = 'owner' then
    return new;
  end if;

  if my_role = 'hr' then
    if new.role is distinct from old.role
       or new.current_salary is distinct from old.current_salary
       or new.auth_id is distinct from old.auth_id then
      raise exception 'hr cannot modify role, current_salary, or auth_id';
    end if;
    return new;
  end if;

  -- employee updating their own row: only the self-service contact fields
  -- (phone, personal_email, address fields, emergency contact, photo_url)
  -- may change.
  if old.auth_id = auth.uid() then
    if new.id is distinct from old.id
       or new.auth_id is distinct from old.auth_id
       or new.employee_code is distinct from old.employee_code
       or new.first_name is distinct from old.first_name
       or new.last_name is distinct from old.last_name
       or new.email is distinct from old.email
       or new.date_of_birth is distinct from old.date_of_birth
       or new.gender is distinct from old.gender
       or new.department_id is distinct from old.department_id
       or new.designation_id is distinct from old.designation_id
       or new.reporting_manager_id is distinct from old.reporting_manager_id
       or new.role is distinct from old.role
       or new.employment_type is distinct from old.employment_type
       or new.employment_status is distinct from old.employment_status
       or new.join_date is distinct from old.join_date
       or new.exit_date is distinct from old.exit_date
       or new.probation_end_date is distinct from old.probation_end_date
       or new.current_salary is distinct from old.current_salary
       or new.previous_employee_id is distinct from old.previous_employee_id
       or new.is_first_login is distinct from old.is_first_login
       or new.is_active is distinct from old.is_active
       or new.created_at is distinct from old.created_at
       or new.created_by is distinct from old.created_by
    then
      raise exception 'employees may only update their own contact fields';
    end if;
    return new;
  end if;

  raise exception 'not permitted to update this employee row';
end;
$$;

create trigger enforce_employee_update
  before update on employees
  for each row execute function enforce_employee_update();
