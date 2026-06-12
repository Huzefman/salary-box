-- 0007_audit_triggers.sql
-- log_changes() SECURITY DEFINER trigger function + attach to the 21 tables
-- listed in docs/DATABASE_SCHEMA.md "Trigger Requirements" (everything
-- except notifications, audit_logs, employee_onboarding_progress).

create or replace function log_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_data jsonb;
  v_new_data jsonb;
  v_record_id uuid;
  v_actor_id uuid;
  v_actor_role user_role;
  v_actor_system_function text;
  v_ip_address inet;
begin
  if tg_op = 'INSERT' then
    v_old_data := null;
    v_new_data := to_jsonb(new);
  elsif tg_op = 'UPDATE' then
    v_old_data := to_jsonb(old);
    v_new_data := to_jsonb(new);
  else
    v_old_data := to_jsonb(old);
    v_new_data := null;
  end if;

  -- PII exclusion: account_number_encrypted is never written to audit_logs.
  if tg_table_name = 'employee_bank_details' then
    if v_old_data is not null then
      v_old_data := (v_old_data - 'account_number_encrypted')
        || jsonb_build_object('account_number_encrypted', jsonb_build_object('masked', true));
    end if;
    if v_new_data is not null then
      v_new_data := (v_new_data - 'account_number_encrypted')
        || jsonb_build_object('account_number_encrypted', jsonb_build_object('masked', true));
    end if;
  end if;

  -- app_config's PK is `key` (text), not `id` (uuid). Derive a stable uuid
  -- so record_id can stay uuid-typed per DATABASE_SCHEMA.md.
  if tg_table_name = 'app_config' then
    if tg_op = 'DELETE' then
      v_record_id := uuid_generate_v5('00000000-0000-0000-0000-000000000000'::uuid, old.key);
    else
      v_record_id := uuid_generate_v5('00000000-0000-0000-0000-000000000000'::uuid, new.key);
    end if;
  elsif tg_op = 'DELETE' then
    v_record_id := old.id;
  else
    v_record_id := new.id;
  end if;

  -- actor_system_function (set via `set_config('app.actor_system_function', ...)`
  -- by scheduled Edge Functions) and actor_id/actor_role are mutually exclusive.
  v_actor_system_function := current_setting('app.actor_system_function', true);

  if v_actor_system_function is not null and v_actor_system_function <> '' then
    v_actor_id := null;
    v_actor_role := null;
  else
    v_actor_system_function := null;
    v_actor_id := get_my_employee_id();
    v_actor_role := get_my_role();
  end if;

  v_ip_address := inet_client_addr();

  insert into audit_logs (
    table_name, record_id, action, actor_id, actor_role,
    actor_system_function, old_data, new_data, ip_address
  ) values (
    tg_table_name, v_record_id, tg_op, v_actor_id, v_actor_role,
    v_actor_system_function, v_old_data, v_new_data, v_ip_address
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger log_changes after insert or update or delete on employees
  for each row execute function log_changes();

create trigger log_changes after insert or update or delete on departments
  for each row execute function log_changes();

create trigger log_changes after insert or update or delete on designations
  for each row execute function log_changes();

create trigger log_changes after insert or update or delete on employee_documents
  for each row execute function log_changes();

create trigger log_changes after insert or update or delete on employee_bank_details
  for each row execute function log_changes();

create trigger log_changes after insert or update or delete on employee_lifecycle_events
  for each row execute function log_changes();

create trigger log_changes after insert or update or delete on attendance_records
  for each row execute function log_changes();

create trigger log_changes after insert or update or delete on attendance_regularization_requests
  for each row execute function log_changes();

create trigger log_changes after insert or update or delete on leave_types
  for each row execute function log_changes();

create trigger log_changes after insert or update or delete on leave_balances
  for each row execute function log_changes();

create trigger log_changes after insert or update or delete on leave_applications
  for each row execute function log_changes();

create trigger log_changes after insert or update or delete on comp_off_requests
  for each row execute function log_changes();

create trigger log_changes after insert or update or delete on shifts
  for each row execute function log_changes();

create trigger log_changes after insert or update or delete on department_shifts
  for each row execute function log_changes();

create trigger log_changes after insert or update or delete on employee_shift_overrides
  for each row execute function log_changes();

create trigger log_changes after insert or update or delete on holidays
  for each row execute function log_changes();

create trigger log_changes after insert or update or delete on onboarding_checklist_templates
  for each row execute function log_changes();

create trigger log_changes after insert or update or delete on ip_whitelist
  for each row execute function log_changes();

create trigger log_changes after insert or update or delete on geofence_config
  for each row execute function log_changes();

create trigger log_changes after insert or update or delete on app_config
  for each row execute function log_changes();

create trigger log_changes after insert or update or delete on employee_optional_holidays
  for each row execute function log_changes();
