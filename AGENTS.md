# HR Tool — Agent Context File

## What this is
Internal HR webapp for a 10–20 employee company. Covers employee management,
attendance, and leave. Stack: React 18 + TypeScript + Tailwind CSS + shadcn/ui,
backed entirely by Supabase (Postgres + RLS, Auth, Storage, Edge Functions).
There is no separate backend server.

This file is a quick-start map for any AI agent picking up work in this repo.
It does not replace the project docs — it points to them.

- **Full conventions, folder structure, non-negotiable rules:** `CLAUDE.md`
- **DB schema (24 tables):** `docs/DATABASE_SCHEMA.md`
- **Validation logic, formulas, BR-XXX rules:** `docs/BUSINESS_RULES.md`
- **RLS policies, role definitions:** `docs/ROLE_RULES.md`
- **Routes and screens per role:** `docs/SCREEN_INVENTORY.md`
- **Edge Function request/response contracts:** `docs/EDGE_FUNCTIONS.md`
- **Architecture / state management / type strategy:** `docs/ARCHITECTURE.md`

If a rule isn't in your current context, read the relevant doc above before
inventing an answer.

## Current status — UPDATE THIS EVERY SESSION
Last updated: 2026-06-18
Active branch: experiment-new-agent
Current session: Completed all remaining M2 features — Activity Timeline, Org
Chart, Profile Edit Requests. Also deleted 4 test employees (EMP-0005–0008)
with full cleanup (auth accounts, audit logs, DB rows). M1 + M2 100% complete.

### M2 — Complete Feature Set
- **M2-1 CSV Export:** "Download CSV" button on EmployeesPage header. Exports
  filtered list with all relevant columns.
- **M2-2 Onboarding Checklist CRUD:** `SettingsOnboardingPage.tsx` with add/
  edit/deactivate/reactivate dialog for `onboarding_checklist_templates`.
- **M2-3 App Configuration:** `AppConfigPage.tsx` with inline editable key-value
  table (Owner only).
- **M2-4 Add Employee Steps 3 & 4:** Expanded NewEmployeePage from 2 steps to 4 —
  Personal Info, Job Details, Documents (optional file upload), Bank Details
  (optional account info). Post-creation success dialog shows temp password.
- **M2-5 Bank Details Edit:** "Edit/Add" button (Owner only) on
  EmployeeBankDetailsTab with dialog for account holder, number, IFSC, bank name.
  Uses direct Supabase upsert.
- **M2-6 Advanced Filters:** Department and employment status dropdowns on
  EmployeesPage with All/Active/Probation/Resigned/Terminated/Future Joiner.
- **M2-7 access-revocation cron:** Deployed. Queries employees where
  `exit_date = today AND is_active = true`, deactivates, deletes auth account.
- **M2-8 exit-date-alert cron:** Deployed. Queries employees where
  `exit_date = today + 7`, creates in-app notifications for Owner/HR/System Admin.
- **M2-9 future-joiner-activation cron:** Deployed. Queries employees where
  `employment_status = 'future_joiner' AND join_date = today`, sets to active,
  notifies Owner/HR.

### M2 — Remaining Features (built this session)

**Activity Timeline** — New "Activity" tab on employee detail page (Owner/HR).
Queries `audit_logs` for the employee and renders a vertical timeline with
action icons, field-level diffs on updates, actor name + role, and timestamps.
(`src/features/employees/components/EmployeeActivityTab.tsx`)

**Org Chart** — `/org-chart` page accessible from sidebar (Owner/HR). Recursive
tree view built from `reporting_manager_id`. Shows avatar, name, code, role
badge. All nodes link to employee detail. (`src/pages/OrgChartPage.tsx`)

**Profile Edit Requests** — Full employee self-service flow:
- `profile_edit_requests` table (migration `0012`) with RLS: employee inserts own
  requests, Owner/HR reads all and updates (approve/reject).
- `review-profile-edit` Edge Function — Owner/HR approves (applies changes via
  `update` on `employees` table using service role) or rejects.
- Employee sees "Request Edit" button on own profile → dialog with editable
  fields (phone, personal_email, address, emergency contact) → submits pending
  request.
- HR/Owner sees "Profile Edits" sidebar link → `/employees/profile-edits` review
  page with approve/reject buttons and optional reviewer notes.
- (`src/pages/ProfileEditReviewsPage.tsx`,
  `src/features/employees/mutations.ts` — `useSubmitProfileEdit`,
  `useReviewProfileEdit`)

### Cleanup Performed
- **Hard deleted EMP-0005–0008** (Abc Def, xyz a, Xyz a, coffee@gmail.com):
  removed auth accounts via GoTrue Admin API (`DELETE /auth/v1/admin/users/{id}`),
  deleted 26 audit_log rows, then deleted employee rows. Removed `deactivate-
  employee` and `reactivate-employee` Edge Functions (undeployed + files deleted).
  4 legitimate employees remain (EMP-0001–0004).

### DB schema changes
- `profile_edit_requests` table added (migration `0012_create_profile_edit_requests`)
- Types regenerated (`src/types/database.types.ts`)

### Edge Functions (deployed)
- `add-lifecycle-event` — Role-gated lifecycle events (promotion, transfer,
  salary revision, resignation, termination, rehire). Termination handles
  orphaned reports + immediate auth revocation.
- `upload-document` — MIME/size validation, SHA-256 hash dupe detection,
  Owner override with audit log, upload to Storage.
- `generate-presigned-url` — 15-min expiry, role-based access check.
- `bulk-import-employees` — CSV parsing, row validation, batch insert.
- `update-employee` — Role-gated field permissions: Owner all, HR all except
  role/salary/auth_id, Employee own non-sensitive only.
- `create-employee` — Full employee creation with auth account, welcome email,
  onboarding progress rows, leave balance rows.
- `access-revocation` — Daily cron: deactivates employees on exit_date.
- `exit-date-alert` — Daily cron: notifies admins of upcoming exits.
- `future-joiner-activation` — Daily cron: activates future_joiners on join_date.
- `review-profile-edit` — Owner/HR approve/reject profile edit requests.

### Known issues
- `origin/main` (fitmantramarketing-sys/salary-box on GitHub) was
  reverted to a pre-scaffold state by a PR merge from `upstream/main`
  (`04bbe85`, "Merge pull request #1 from Huzefman/main") — it currently does
  NOT have the scaffold. Local `main`/`dev`/`feature/auth-rbac` and
  `origin/feature/auth-rbac` all have the full scaffold and are correct.
  Do not push local `main` to `origin/main` without reconciling this — resolve
  when `dev` merges into `main` at milestone completion.
- RESEND_API_KEY not configured in Supabase project secrets → welcome email
  silently fails (non-fatal try/catch).
- Supabase Auth project setting `mailer_allow_unverified_email_sign_ins` set to
  `true` — required because `admin.createUser({ email_confirm: true })` wasn't
  confirming emails when `mailer_autoconfirm` was `false`. Function also calls
  `admin.updateUserById(id, { email_confirm: true })` as defense-in-depth.
- Migration naming conflict: two `0010_*` files (first superseded by second).
  Both applied via `supabase db query`, CLI history out of sync with remote.
  Run `supabase migration repair` to reconcile.
- 3 cron functions deployed but schedules not configured in Supabase Dashboard:
  access-revocation (23:55 IST), exit-date-alert (09:15 IST),
  future-joiner-activation (00:01 IST).

## Supabase project access (for agents)
This repo has a project-scoped Supabase MCP server configured in `.mcp.json`,
authenticated via a personal access token (`SUPABASE_ACCESS_TOKEN`, set as a
local Windows user environment variable — never committed). When connected,
the `mcp__supabase__*` tools give direct access to project
`hqiggiqwyxjiltltvoay` (the HR Tool project):

- `list_tables`, `list_migrations`, `list_extensions`, `get_advisors`,
  `get_logs`, `get_project_url` — inspection, always safe to call.
- `apply_migration` — applies SQL directly to this remote project and records
  it in the project's migration history. Workflow: write the SQL file to
  `supabase/migrations/<NNNN>_<name>.sql` first (for version control), then
  call `apply_migration` with the same name/content so local files and the
  remote project stay in sync.
- `execute_sql` — ad-hoc queries for inspection/debugging only. Don't use it
  for schema changes that should be migrations.
- `generate_typescript_types` — regenerate `src/types/database.types.ts`
  after schema changes. The current generator (PostgrestVersion 14.5) already
  includes `Relationships: [...]` per table automatically.

If the MCP server isn't connected in a session, say so and fall back to
writing the migration SQL for the user to apply.

## Roles (4 only)
`owner`, `hr`, `employee`, `system_admin` — see `docs/ROLE_RULES.md` for the
full RLS policy matrix per table. RLS is enforced at the database level; never
replicate access control only in the frontend.

## File structure
```
src/
  components/ui/        ← shadcn/ui primitives only
  components/layout/    ← Sidebar, Header, RoleGuard
  pages/                ← thin route-level components, import from features/
  features/<domain>/    ← components/, hooks/, schemas/, utils/, index.ts
  hooks/                ← useAuth, useRole
  lib/                  ← supabase.ts, queryClient.ts
  types/                ← database.types.ts (generated, do not edit) + index.ts
supabase/
  migrations/           ← numbered SQL migrations
  seed.sql
  functions/
    _shared/            ← supabase.ts, auth.ts, response.ts, email.ts
    <function-name>/index.ts
```

## Critical rules
- RLS is always on. Never disable it to make something work — fix the policy.
- Edge Functions are the source of truth for server timestamps
  (`check_in_time`, `check_out_time`, `applied_at`, etc.). Never send these
  from the client.
- No hard deletes — set `is_active = false` and filter on it.
- `account_number_encrypted` is never returned to the frontend.
- Business rules live in Edge Functions or DB constraints, never only in React.
- Presigned URLs only for document access — never expose raw storage paths.
- Never install `axios` — use `@supabase/supabase-js` or native `fetch`.
- Never create an Express/FastAPI/Node server — Supabase is the entire backend.
- Never use `localStorage` for auth — Supabase Auth manages sessions.
- Regenerate DB types after every migration: `npm run types:gen`.

## Branch rules
- `main` — protected, production only.
- `dev` — integration branch, should always build and pass typecheck/lint.
- `feature/<module>` — one branch per milestone/module, branched from `dev`,
  merged back into `dev` (e.g. `feature/auth-rbac`, `feature/employee-module`,
  `feature/attendance-module`, `feature/leave-module`, `feature/reports-polish`).
- `fix/<short-description>` — short-lived, branched from `dev`.
- `dev` → `main` only at milestone completion.

## What NOT to do
- Don't write a custom backend server.
- Don't skip or weaken RLS policies.
- Don't use any auth mechanism other than Supabase Auth.
- Don't mix work from two milestones/modules in one branch.
- Don't enforce business rules only in React (see CLAUDE.md → Non-Negotiable Rules).
- Don't commit directly to `main` or `dev`.
