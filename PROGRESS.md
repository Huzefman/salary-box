# Progress Log

## Current State
Date: 2026-06-10
Active branch: feature/auth-rbac
Milestone: M1 — Foundation (Supabase setup, migrations, RLS, auth, RBAC,
department/designation CRUD, employee CRUD P0, sidebar shell)

## Completed
- All spec/context docs in `docs/` (DATABASE_SCHEMA, BUSINESS_RULES,
  ROLE_RULES, SCREEN_INVENTORY, EDGE_FUNCTIONS, ARCHITECTURE) plus `CLAUDE.md`
- Full repo scaffold: Vite + React 18 + TypeScript + Tailwind + shadcn/ui
- Route tree, layout shell, role guard component, Zustand auth store
- Feature-folder scaffolds (components/hooks/schemas/utils) for auth,
  employees, attendance, leave, reports, settings
- `supabase/` project config, `seed.sql`, `_shared/` Edge Function utilities
- Stub `index.ts` for all 36 Edge Functions (21 client-callable + 15 cron)
  with TODOs referencing `docs/EDGE_FUNCTIONS.md`
- `.env.example` and `.gitignore` updated for Supabase CLI artifacts
- Removed vestigial `apps/` monorepo placeholders
- `npm install`, `npm run typecheck`, `npm run lint`, `npm run dev` all
  verified clean
- `main` / `dev` / `feature/auth-rbac` branch structure created;
  `main` re-pointed to track `origin/main`
- AGENTS.md, PROGRESS.md, CONVENTIONS.md, ENV.md added at repo root

## In Progress
- Nothing yet beyond the scaffold above on `feature/auth-rbac`.

## Pending (this milestone — M1)
- Initial SQL migration covering all 24 tables (`docs/DATABASE_SCHEMA.md`)
- RLS policies per table per role (`docs/ROLE_RULES.md`)
- Auth flow: login, set-password, session handling
- Real RBAC wiring for `useAuth` / `useRole` (currently scaffolded only)
- Department/designation CRUD (Owner only)
- Employee CRUD (P0 fields)
- Sidebar shell wired to real role/session data

## Decisions Made
- 2026-06-10: Adopted `main` / `dev` / `feature/*` branch workflow per
  `HR_Tool_Build_Guide_1.docx` — one active feature branch per milestone,
  build sequentially M1 → M5.
- 2026-06-10: `main` re-pointed to track `origin` (`fitmantramarketing-sys/salary-box`)
  instead of `upstream` (`Huzefman/salary-box`) — no push access to upstream.

## Known Issues
- None.
