-- 0008_security_hardening.sql
-- Addresses Supabase advisor findings from migrations 0001-0007:
--   1. function_search_path_mutable (WARN/SECURITY) on 5 trigger functions
--      that were missing `set search_path = public`.
--   2. auth_rls_initplan (WARN/PERFORMANCE) on 3 policies that called
--      auth.uid() directly instead of (select auth.uid()), causing
--      per-row re-evaluation instead of a single initplan evaluation.
-- No behavioral changes -- logic is identical to the original definitions.

-- ============================================================
-- 1. set search_path = public on trigger functions
-- ============================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function enforce_employee_update()
returns trigger
language plpgsql
set search_path = public
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

create or replace function enforce_document_softdelete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.employee_id is distinct from old.employee_id
     or new.document_type is distinct from old.document_type
     or new.file_name is distinct from old.file_name
     or new.storage_path is distinct from old.storage_path
     or new.file_size_bytes is distinct from old.file_size_bytes
     or new.mime_type is distinct from old.mime_type
     or new.document_hash is distinct from old.document_hash
     or new.uploaded_by is distinct from old.uploaded_by
     or new.created_at is distinct from old.created_at
  then
    raise exception 'employee_documents: only is_active may be updated';
  end if;
  return new;
end;
$$;

create or replace function enforce_attendance_timestamps()
returns trigger
language plpgsql
set search_path = public
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

create or replace function enforce_leave_application_update()
returns trigger
language plpgsql
set search_path = public
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

-- ============================================================
-- 2. auth_rls_initplan: wrap auth.uid() so it's evaluated once
--    per statement (via initplan) instead of once per row.
-- ============================================================

alter policy employees_select on employees
using (
  get_my_role() = 'owner'
  or auth_id = (select auth.uid())
  or (
    get_my_role() in ('hr', 'system_admin')
    and is_active = true
    and (employment_status != 'future_joiner' or join_date <= current_date)
  )
);

alter policy employees_update on employees
using (
  get_my_role() = 'owner'
  or (get_my_role() = 'hr' and is_active = true)
  or auth_id = (select auth.uid())
)
with check (
  get_my_role() = 'owner'
  or (get_my_role() = 'hr' and is_active = true)
  or auth_id = (select auth.uid())
);

alter policy department_shifts_select on department_shifts
using (
  get_my_role() in ('owner', 'hr', 'system_admin')
  or department_id = (select department_id from employees where auth_id = (select auth.uid()))
);
