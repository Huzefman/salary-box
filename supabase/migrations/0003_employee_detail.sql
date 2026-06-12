-- 0003_employee_detail.sql
-- Tables 4-8: employee_documents, employee_bank_details,
-- employee_lifecycle_events, onboarding_checklist_templates,
-- employee_onboarding_progress + RLS.
-- Source: docs/DATABASE_SCHEMA.md, docs/ROLE_RULES.md

-- ============================================================
-- 4. employee_documents
-- ============================================================

create table employee_documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id),
  document_type text not null,
  file_name text not null,
  storage_path text not null,
  file_size_bytes integer not null,
  mime_type text not null,
  document_hash text,
  uploaded_by uuid not null references employees(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint employee_documents_file_size_check check (file_size_bytes <= 5242880),
  constraint employee_documents_type_check check (
    document_type in ('aadhar', 'pan', 'offer_letter', 'appointment_letter', 'experience_letter', 'other')
  )
);

create index idx_employee_documents_employee_id on employee_documents (employee_id);
create index idx_employee_documents_type on employee_documents (document_type);

create unique index idx_employee_documents_hash
  on employee_documents (document_type, document_hash)
  where document_type in ('aadhar', 'pan') and is_active = true;

alter table employee_documents enable row level security;

create policy employee_documents_select on employee_documents for select
using (
  get_my_role() in ('owner', 'hr', 'system_admin')
  or employee_id = get_my_employee_id()
);

create policy employee_documents_insert on employee_documents for insert
with check (
  get_my_role() in ('owner', 'hr')
  or employee_id = get_my_employee_id()
);

create policy employee_documents_update on employee_documents for update
using (get_my_role() in ('owner', 'hr'))
with check (get_my_role() in ('owner', 'hr'));

-- Owner/HR may only soft-delete (toggle is_active) via UPDATE; every other
-- column on a document row is immutable after upload.
create or replace function enforce_document_softdelete()
returns trigger
language plpgsql
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

create trigger enforce_document_softdelete
  before update on employee_documents
  for each row execute function enforce_document_softdelete();

-- ============================================================
-- 5. employee_bank_details
-- ============================================================

create table employee_bank_details (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id),
  account_number_encrypted text not null,
  account_number_last4 char(4) not null,
  ifsc_code text not null,
  bank_name text not null,
  account_holder_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references employees(id)
);

create unique index idx_bank_details_employee_active
  on employee_bank_details (employee_id)
  where is_active = true;

create index idx_bank_details_employee_id on employee_bank_details (employee_id);

create trigger set_updated_at
  before update on employee_bank_details
  for each row execute function set_updated_at();

alter table employee_bank_details enable row level security;

-- Owner only. HR/System Admin have no access at all (PRD Open Question #7).
-- account_number_encrypted is never selected by the client regardless --
-- stripped at the Edge Function/API layer per CLAUDE.md.
create policy employee_bank_details_select on employee_bank_details for select
using (
  get_my_role() = 'owner'
  or employee_id = get_my_employee_id()
);

create policy employee_bank_details_insert on employee_bank_details for insert
with check (get_my_role() = 'owner');

create policy employee_bank_details_update on employee_bank_details for update
using (get_my_role() = 'owner')
with check (get_my_role() = 'owner');

-- ============================================================
-- 6. employee_lifecycle_events (immutable, INSERT only)
-- ============================================================

create table employee_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id),
  event_type lifecycle_event_type not null,
  effective_date date not null,
  previous_department_id uuid references departments(id),
  new_department_id uuid references departments(id),
  previous_designation_id uuid references designations(id),
  new_designation_id uuid references designations(id),
  previous_salary numeric(12,2),
  new_salary numeric(12,2),
  reason text,
  document_path text,
  performed_by uuid not null references employees(id),
  created_at timestamptz not null default now()
);

create index idx_lifecycle_employee_id on employee_lifecycle_events (employee_id);
create index idx_lifecycle_event_type on employee_lifecycle_events (event_type);
create index idx_lifecycle_effective_date on employee_lifecycle_events (effective_date);

alter table employee_lifecycle_events enable row level security;

create policy employee_lifecycle_events_select on employee_lifecycle_events for select
using (
  get_my_role() in ('owner', 'hr', 'system_admin')
  or employee_id = get_my_employee_id()
);

-- Only Owner may insert termination / salary_revision events (BR + ROLE_RULES
-- escalation rules). No UPDATE/DELETE policies anywhere -- immutable by
-- omission.
create policy employee_lifecycle_events_insert on employee_lifecycle_events for insert
with check (
  get_my_role() = 'owner'
  or (get_my_role() = 'hr' and event_type not in ('termination', 'salary_revision'))
);

-- ============================================================
-- 7. onboarding_checklist_templates
-- ============================================================

create table onboarding_checklist_templates (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,
  description text,
  is_required boolean not null default true,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table onboarding_checklist_templates enable row level security;

create policy onboarding_checklist_templates_select on onboarding_checklist_templates for select
using (
  get_my_role() in ('owner', 'hr', 'system_admin')
  or is_active = true
);

create policy onboarding_checklist_templates_insert on onboarding_checklist_templates for insert
with check (get_my_role() = 'owner');

create policy onboarding_checklist_templates_update on onboarding_checklist_templates for update
using (get_my_role() = 'owner')
with check (get_my_role() = 'owner');

-- ============================================================
-- 8. employee_onboarding_progress
-- ============================================================

create table employee_onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id),
  checklist_item_id uuid not null references onboarding_checklist_templates(id),
  is_completed boolean not null default false,
  completed_at timestamptz,
  completed_by uuid references employees(id),
  unique (employee_id, checklist_item_id)
);

create index idx_onboarding_progress_employee_id on employee_onboarding_progress (employee_id);

alter table employee_onboarding_progress enable row level security;

create policy employee_onboarding_progress_select on employee_onboarding_progress for select
using (
  get_my_role() in ('owner', 'hr', 'system_admin')
  or employee_id = get_my_employee_id()
);

create policy employee_onboarding_progress_insert on employee_onboarding_progress for insert
with check (get_my_role() in ('owner', 'hr'));

create policy employee_onboarding_progress_update on employee_onboarding_progress for update
using (
  get_my_role() in ('owner', 'hr')
  or employee_id = get_my_employee_id()
)
with check (
  get_my_role() in ('owner', 'hr')
  or employee_id = get_my_employee_id()
);
