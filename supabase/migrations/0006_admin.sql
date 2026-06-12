-- 0006_admin.sql
-- Tables 19-23: ip_whitelist, geofence_config, notifications, audit_logs,
-- app_config + RLS + app_config seed defaults.
-- Source: docs/DATABASE_SCHEMA.md, docs/ROLE_RULES.md, supabase/seed.sql

-- ============================================================
-- 19. ip_whitelist
-- ============================================================

create table ip_whitelist (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  ip_range cidr not null,
  is_active boolean not null default true,
  created_by uuid not null references employees(id),
  created_at timestamptz not null default now()
);

alter table ip_whitelist enable row level security;

create policy ip_whitelist_select on ip_whitelist for select
using (get_my_role() in ('owner', 'hr', 'system_admin'));

create policy ip_whitelist_insert on ip_whitelist for insert
with check (get_my_role() in ('owner', 'system_admin'));

create policy ip_whitelist_update on ip_whitelist for update
using (get_my_role() in ('owner', 'system_admin'))
with check (get_my_role() in ('owner', 'system_admin'));

create policy ip_whitelist_delete on ip_whitelist for delete
using (get_my_role() in ('owner', 'system_admin'));

-- ============================================================
-- 20. geofence_config
-- ============================================================

create table geofence_config (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  latitude numeric(10,7) not null,
  longitude numeric(10,7) not null,
  radius_meters integer not null default 100,
  is_active boolean not null default true,
  created_by uuid not null references employees(id),
  created_at timestamptz not null default now()
);

alter table geofence_config enable row level security;

create policy geofence_config_select on geofence_config for select
using (get_my_role() in ('owner', 'hr', 'system_admin'));

create policy geofence_config_insert on geofence_config for insert
with check (get_my_role() in ('owner', 'system_admin'));

create policy geofence_config_update on geofence_config for update
using (get_my_role() in ('owner', 'system_admin'))
with check (get_my_role() in ('owner', 'system_admin'));

create policy geofence_config_delete on geofence_config for delete
using (get_my_role() in ('owner', 'system_admin'));

-- ============================================================
-- 21. notifications
-- ============================================================

create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references employees(id),
  title text not null,
  body text not null,
  type text not null,
  reference_id uuid,
  reference_table text,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_recipient_unread on notifications (recipient_id, is_read);

alter table notifications enable row level security;

-- System Admin has no access at all, even to its own employee row's
-- notifications, per ROLE_RULES.md.
create policy notifications_select on notifications for select
using (
  get_my_role() != 'system_admin'
  and recipient_id = get_my_employee_id()
);

create policy notifications_update on notifications for update
using (
  get_my_role() != 'system_admin'
  and recipient_id = get_my_employee_id()
)
with check (
  get_my_role() != 'system_admin'
  and recipient_id = get_my_employee_id()
);

-- No INSERT/DELETE policies: written only by Edge Functions via the
-- service-role client, which bypasses RLS.

-- ============================================================
-- 22. audit_logs
-- ============================================================

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  action text not null,
  actor_id uuid references employees(id),
  actor_role user_role,
  actor_system_function text,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index idx_audit_table_record on audit_logs (table_name, record_id);
create index idx_audit_actor_id on audit_logs (actor_id);
create index idx_audit_created_at on audit_logs (created_at);
create index idx_audit_table_name on audit_logs (table_name);

alter table audit_logs enable row level security;

create policy audit_logs_select on audit_logs for select
using (get_my_role() in ('owner', 'system_admin'));

-- No INSERT/UPDATE/DELETE policies for any role: written only by the
-- log_changes() SECURITY DEFINER trigger (0007), immutable otherwise.

-- ============================================================
-- 23. app_config
-- ============================================================

create table app_config (
  key text primary key,
  value text not null,
  description text,
  updated_by uuid references employees(id),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on app_config
  for each row execute function set_updated_at();

alter table app_config enable row level security;

create policy app_config_select on app_config for select
using (get_my_role() in ('owner', 'hr', 'system_admin'));

create policy app_config_insert on app_config for insert
with check (get_my_role() = 'owner');

create policy app_config_update on app_config for update
using (get_my_role() = 'owner')
with check (get_my_role() = 'owner');

-- ============================================================
-- app_config seed defaults (mirrors supabase/seed.sql)
-- ============================================================

insert into app_config (key, value, description, updated_by) values
  ('regularization_window_days', '7',        'Max calendar days in the past for regularization requests', null),
  ('comp_off_expiry_days',        '60',       'Days after worked date before comp-off expires',            null),
  ('leave_sla_business_days',     '2',        'Business days before pending leave is auto-escalated',      null),
  ('optional_holiday_limit_per_year', '2',   'Max optional holidays an employee can opt into per year',   null),
  ('auto_checkout_time',          '23:59:00', 'IST time at which auto-checkout cron runs (HH:MM:SS)',      null),
  ('rehire_carry_leave_balance',  'false',    'Carry leave balance when an employee is rehired',           null)
on conflict (key) do nothing;
