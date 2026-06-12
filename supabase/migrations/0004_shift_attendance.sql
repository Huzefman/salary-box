-- 0004_shift_attendance.sql
-- Tables 9-13: shifts, department_shifts, employee_shift_overrides,
-- attendance_records, attendance_regularization_requests + RLS.
-- Source: docs/DATABASE_SCHEMA.md, docs/ROLE_RULES.md

-- ============================================================
-- 9. shifts
-- ============================================================

create table shifts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_time time not null,
  end_time time not null,
  break_minutes smallint not null default 60,
  weekly_off_days smallint[] not null default array[0]::smallint[],
  grace_period_minutes smallint not null default 15,
  late_mark_threshold smallint not null default 3,
  is_night_shift boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on shifts
  for each row execute function set_updated_at();

alter table shifts enable row level security;

create policy shifts_select on shifts for select
using (
  get_my_role() in ('owner', 'hr', 'system_admin')
  or is_active = true
);

create policy shifts_insert on shifts for insert
with check (get_my_role() in ('owner', 'hr'));

create policy shifts_update on shifts for update
using (get_my_role() in ('owner', 'hr'))
with check (get_my_role() in ('owner', 'hr'));

-- ============================================================
-- 10. department_shifts
-- ============================================================

create table department_shifts (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id),
  shift_id uuid not null references shifts(id),
  effective_from date not null,
  effective_to date,
  unique (department_id, effective_from)
);

alter table department_shifts enable row level security;

create policy department_shifts_select on department_shifts for select
using (
  get_my_role() in ('owner', 'hr', 'system_admin')
  or department_id = (select department_id from employees where auth_id = auth.uid())
);

create policy department_shifts_insert on department_shifts for insert
with check (get_my_role() in ('owner', 'hr'));

create policy department_shifts_update on department_shifts for update
using (get_my_role() in ('owner', 'hr'))
with check (get_my_role() in ('owner', 'hr'));

create policy department_shifts_delete on department_shifts for delete
using (get_my_role() in ('owner', 'hr'));

-- ============================================================
-- 11. employee_shift_overrides
-- ============================================================

create table employee_shift_overrides (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id),
  shift_id uuid not null references shifts(id),
  effective_from date not null,
  effective_to date,
  assigned_by uuid not null references employees(id),
  unique (employee_id, effective_from)
);

create index idx_shift_overrides_employee_id on employee_shift_overrides (employee_id);

alter table employee_shift_overrides enable row level security;

create policy employee_shift_overrides_select on employee_shift_overrides for select
using (
  get_my_role() in ('owner', 'hr', 'system_admin')
  or employee_id = get_my_employee_id()
);

create policy employee_shift_overrides_insert on employee_shift_overrides for insert
with check (get_my_role() in ('owner', 'hr'));

create policy employee_shift_overrides_update on employee_shift_overrides for update
using (get_my_role() in ('owner', 'hr'))
with check (get_my_role() in ('owner', 'hr'));

create policy employee_shift_overrides_delete on employee_shift_overrides for delete
using (get_my_role() in ('owner', 'hr'));

-- ============================================================
-- 12. attendance_records
-- ============================================================

create table attendance_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id),
  date date not null,
  shift_id uuid references shifts(id),
  check_in_time timestamptz,
  check_out_time timestamptz,
  check_in_ip inet,
  check_in_lat numeric(10,7),
  check_in_lng numeric(10,7),
  check_out_lat numeric(10,7),
  check_out_lng numeric(10,7),
  is_geo_flagged boolean not null default false,
  is_wfh boolean not null default false,
  status attendance_status not null default 'absent',
  total_hours numeric(4,2),
  overtime_hours numeric(4,2),
  overtime_approved boolean,
  overtime_approved_by uuid references employees(id),
  is_late boolean not null default false,
  is_manually_entered boolean not null default false,
  manual_entry_reason text,
  manual_entry_by uuid references employees(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, date)
);

create index idx_attendance_employee_date on attendance_records (employee_id, date);
create index idx_attendance_date on attendance_records (date);
create index idx_attendance_status on attendance_records (status);
create index idx_attendance_is_late on attendance_records (is_late);

create trigger set_updated_at
  before update on attendance_records
  for each row execute function set_updated_at();

alter table attendance_records enable row level security;

create policy attendance_records_select on attendance_records for select
using (
  get_my_role() in ('owner', 'hr', 'system_admin')
  or employee_id = get_my_employee_id()
);

-- Defense-in-depth only: normal check-in/out/WFH flows go through Edge
-- Functions using the service-role client, which bypasses RLS entirely.
create policy attendance_records_insert on attendance_records for insert
with check (
  get_my_role() in ('owner', 'hr')
  and is_manually_entered = true
  and manual_entry_reason is not null
  and manual_entry_by is not null
);

create policy attendance_records_update on attendance_records for update
using (get_my_role() in ('owner', 'hr'))
with check (get_my_role() in ('owner', 'hr'));

-- check_in_time / check_out_time are Edge-Function-only regardless of the
-- caller's row-level role (ROLE_RULES.md "Critical" rule).
create or replace function enforce_attendance_timestamps()
returns trigger
language plpgsql
as $$
begin
  if auth.role() is distinct from 'service_role' then
    if new.check_in_time is distinct from old.check_in_time
       or new.check_out_time is distinct from old.check_out_time then
      raise exception 'check_in_time and check_out_time can only be set by Edge Functions';
    end if;
  end if;
  return new;
end;
$$;

create trigger enforce_attendance_timestamps
  before update on attendance_records
  for each row execute function enforce_attendance_timestamps();

-- ============================================================
-- 13. attendance_regularization_requests
-- ============================================================

create table attendance_regularization_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id),
  attendance_record_id uuid not null references attendance_records(id),
  requested_status attendance_status not null,
  requested_check_in timestamptz,
  requested_check_out timestamptz,
  reason text not null,
  status regularization_status not null default 'pending',
  reviewed_by uuid references employees(id),
  reviewed_at timestamptz,
  reviewer_comment text,
  created_at timestamptz not null default now()
);

create index idx_regularization_employee_id on attendance_regularization_requests (employee_id);
create index idx_regularization_status on attendance_regularization_requests (status);

create unique index idx_regularization_pending_unique
  on attendance_regularization_requests (attendance_record_id)
  where status = 'pending';

alter table attendance_regularization_requests enable row level security;

create policy attendance_regularization_requests_select on attendance_regularization_requests for select
using (
  get_my_role() in ('owner', 'hr', 'system_admin')
  or employee_id = get_my_employee_id()
);

create policy attendance_regularization_requests_insert on attendance_regularization_requests for insert
with check (
  get_my_role() in ('owner', 'hr')
  or employee_id = get_my_employee_id()
);

create policy attendance_regularization_requests_update on attendance_regularization_requests for update
using (get_my_role() in ('owner', 'hr'))
with check (get_my_role() in ('owner', 'hr'));
