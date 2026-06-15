-- 0005_leave.sql
-- Tables 14-18 + 24: leave_types, leave_balances, leave_applications,
-- holidays, comp_off_requests, employee_optional_holidays + RLS.
-- Source: docs/DATABASE_SCHEMA.md, docs/ROLE_RULES.md

-- ============================================================
-- 14. leave_types
-- ============================================================

create table leave_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  accrual_type leave_accrual_type not null default 'yearly',
  accrual_days numeric(5,2),
  max_carry_forward_days numeric(5,2) not null default 0,
  carry_forward_expiry_days smallint,
  allow_negative_balance boolean not null default false,
  is_encashable boolean not null default false,
  is_lwp boolean not null default false,
  requires_attachment boolean not null default false,
  attachment_required_after_days smallint,
  max_consecutive_days smallint,
  min_notice_days smallint not null default 0,
  applicable_gender gender,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on leave_types
  for each row execute function set_updated_at();

alter table leave_types enable row level security;

create policy leave_types_select on leave_types for select
using (
  get_my_role() in ('owner', 'hr', 'system_admin')
  or is_active = true
);

create policy leave_types_insert on leave_types for insert
with check (get_my_role() = 'owner');

create policy leave_types_update on leave_types for update
using (get_my_role() = 'owner')
with check (get_my_role() = 'owner');

-- ============================================================
-- 15. leave_balances
-- ============================================================

create table leave_balances (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id),
  leave_type_id uuid not null references leave_types(id),
  year smallint not null,
  opening_balance numeric(5,2) not null default 0,
  carry_forward_amount numeric(5,2) not null default 0,
  accrued numeric(5,2) not null default 0,
  taken numeric(5,2) not null default 0,
  pending numeric(5,2) not null default 0,
  adjusted numeric(5,2) not null default 0,
  carry_forward_expiry date,
  updated_at timestamptz not null default now(),
  unique (employee_id, leave_type_id, year)
);

create index idx_leave_balances_employee_id on leave_balances (employee_id);
create index idx_leave_balances_employee_year on leave_balances (employee_id, year);
create index idx_leave_balances_expiry on leave_balances (carry_forward_expiry);

create trigger set_updated_at
  before update on leave_balances
  for each row execute function set_updated_at();

alter table leave_balances enable row level security;

create policy leave_balances_select on leave_balances for select
using (
  get_my_role() in ('owner', 'hr', 'system_admin')
  or employee_id = get_my_employee_id()
);

create policy leave_balances_insert on leave_balances for insert
with check (get_my_role() in ('owner', 'hr'));

create policy leave_balances_update on leave_balances for update
using (get_my_role() in ('owner', 'hr'))
with check (get_my_role() in ('owner', 'hr'));

-- ============================================================
-- 16. leave_applications
-- ============================================================

create table leave_applications (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id),
  leave_type_id uuid not null references leave_types(id),
  from_date date not null,
  to_date date not null,
  working_days_count numeric(4,2) not null,
  is_half_day boolean not null default false,
  half_day_period text,
  reason text not null,
  attachment_path text,
  status leave_status not null default 'pending',
  applied_at timestamptz not null default now(),
  reviewed_by uuid references employees(id),
  reviewed_at timestamptz,
  reviewer_comment text,
  cancelled_by uuid references employees(id),
  cancelled_at timestamptz,
  cancellation_reason text,
  escalated_to uuid references employees(id),
  escalated_at timestamptz,
  cancellation_requested boolean not null default false,
  cancellation_requested_at timestamptz,
  constraint leave_applications_to_after_from check (to_date >= from_date),
  constraint leave_applications_working_days_positive check (working_days_count > 0),
  constraint leave_applications_half_day_period_check check (
    half_day_period in ('morning', 'afternoon') or is_half_day = false
  )
);

create index idx_leave_applications_employee_id on leave_applications (employee_id);
create index idx_leave_applications_status on leave_applications (status);
create index idx_leave_applications_from_date on leave_applications (from_date);
create index idx_leave_applications_reviewed_by on leave_applications (reviewed_by);

create index idx_leave_applications_cancellation_requested
  on leave_applications (cancellation_requested)
  where cancellation_requested = true;

alter table leave_applications enable row level security;

create policy leave_applications_select on leave_applications for select
using (
  get_my_role() in ('owner', 'hr', 'system_admin')
  or employee_id = get_my_employee_id()
);

create policy leave_applications_insert on leave_applications for insert
with check (
  get_my_role() in ('owner', 'hr')
  or employee_id = get_my_employee_id()
);

create policy leave_applications_update on leave_applications for update
using (
  get_my_role() = 'owner'
  or (get_my_role() = 'hr' and (status = 'pending' or cancellation_requested = true))
  or employee_id = get_my_employee_id()
)
with check (
  get_my_role() in ('owner', 'hr')
  or employee_id = get_my_employee_id()
);

-- CLAUDE.md immutable columns + status-transition rules per role. RLS alone
-- cannot express column-level / transition checks, so enforce via trigger.
create or replace function enforce_leave_application_update()
returns trigger
language plpgsql
as $$
declare
  my_role user_role := get_my_role();
begin
  if new.employee_id is distinct from old.employee_id
     or new.leave_type_id is distinct from old.leave_type_id
     or new.from_date is distinct from old.from_date
     or new.to_date is distinct from old.to_date
     or new.working_days_count is distinct from old.working_days_count
     or new.applied_at is distinct from old.applied_at
  then
    raise exception 'employee_id, leave_type_id, from_date, to_date, working_days_count and applied_at are immutable';
  end if;

  if my_role = 'owner' then
    return new;
  end if;

  if my_role = 'hr' then
    if old.status = 'pending' and new.status in ('approved', 'rejected') then
      return new;
    end if;
    if old.status = 'approved' and old.cancellation_requested = true and new.status = 'cancelled' then
      return new;
    end if;
    raise exception 'hr may only approve/reject a pending application or confirm a requested cancellation';
  end if;

  if old.employee_id = get_my_employee_id() then
    if old.status = 'pending' and new.status = 'cancelled' then
      return new;
    end if;
    if old.status = 'approved' and new.status = 'approved'
       and old.cancellation_requested = false and new.cancellation_requested = true
       and new.cancellation_requested_at is not null then
      return new;
    end if;
    raise exception 'employees may only cancel a pending application or request cancellation of an approved application';
  end if;

  raise exception 'not permitted to update this leave application';
end;
$$;

create trigger enforce_leave_application_update
  before update on leave_applications
  for each row execute function enforce_leave_application_update();

-- ============================================================
-- 17. holidays
-- ============================================================

create table holidays (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  name text not null,
  type holiday_type not null,
  is_optional boolean not null default false,
  state_code text,
  year smallint not null,
  created_at timestamptz not null default now(),
  unique (date, type)
);

create index idx_holidays_date on holidays (date);
create index idx_holidays_year on holidays (year);

alter table holidays enable row level security;

create policy holidays_select on holidays for select
using (true);

create policy holidays_insert on holidays for insert
with check (get_my_role() in ('owner', 'hr'));

create policy holidays_update on holidays for update
using (get_my_role() in ('owner', 'hr'))
with check (get_my_role() in ('owner', 'hr'));

create policy holidays_delete on holidays for delete
using (get_my_role() in ('owner', 'hr'));

-- ============================================================
-- 18. comp_off_requests
-- ============================================================

create table comp_off_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id),
  worked_date date not null,
  hours_worked numeric(4,2),
  reason text,
  status regularization_status not null default 'pending',
  reviewed_by uuid references employees(id),
  reviewed_at timestamptz,
  reviewer_comment text,
  comp_off_expiry_date date,
  leave_balance_id uuid references leave_balances(id),
  created_at timestamptz not null default now()
);

create index idx_comp_off_employee_id on comp_off_requests (employee_id);
create index idx_comp_off_status on comp_off_requests (status);

alter table comp_off_requests enable row level security;

create policy comp_off_requests_select on comp_off_requests for select
using (
  get_my_role() in ('owner', 'hr', 'system_admin')
  or employee_id = get_my_employee_id()
);

create policy comp_off_requests_insert on comp_off_requests for insert
with check (
  get_my_role() in ('owner', 'hr')
  or employee_id = get_my_employee_id()
);

create policy comp_off_requests_update on comp_off_requests for update
using (get_my_role() in ('owner', 'hr'))
with check (get_my_role() in ('owner', 'hr'));

-- ============================================================
-- 24. employee_optional_holidays
-- ============================================================

create table employee_optional_holidays (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id),
  holiday_id uuid not null references holidays(id),
  year smallint not null,
  created_at timestamptz not null default now(),
  unique (employee_id, holiday_id)
);

create index idx_optional_holidays_employee_year on employee_optional_holidays (employee_id, year);

alter table employee_optional_holidays enable row level security;

create policy employee_optional_holidays_select on employee_optional_holidays for select
using (
  get_my_role() in ('owner', 'hr', 'system_admin')
  or employee_id = get_my_employee_id()
);

create policy employee_optional_holidays_insert on employee_optional_holidays for insert
with check (
  get_my_role() in ('owner', 'hr')
  or employee_id = get_my_employee_id()
);

create policy employee_optional_holidays_delete on employee_optional_holidays for delete
using (
  get_my_role() in ('owner', 'hr')
  or employee_id = get_my_employee_id()
);
