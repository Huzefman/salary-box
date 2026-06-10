# Conventions

Quick-reference for naming, branching, and commit style. For deeper
architectural conventions (TanStack Query key patterns, Zod schema co-location,
Edge Function request/response shapes, date/time handling) see `CLAUDE.md` and
`docs/ARCHITECTURE.md` — this file does not repeat those.

## File naming
- Components: PascalCase — `EmployeeForm.tsx`
- Hooks: camelCase, `use` prefix — `useEmployees.ts`
- Utils / formatters: camelCase — `formatDate.ts`
- Pages: PascalCase, `Page` suffix — `EmployeeDetailPage.tsx`, one per route
  in `src/pages/`
- Feature folders: lowercase domain name — `src/features/employees/`

## Supabase client usage
- Frontend: a single instance only — `import { supabase } from '@/lib/supabase'`.
  Never instantiate a new client in a component or hook.
- Edge Functions: the service-role client from
  `supabase/functions/_shared/supabase.ts`. Never expose the service-role key
  to the browser.

## TypeScript
- Never use `any`.
- DB types come from `src/types/database.types.ts` (generated — do not hand-edit),
  re-exported via `src/types/index.ts`.
- Regenerate types after every migration: `npm run types:gen`.
- All component props and Zod-inferred payload types must be explicit.

## Commit prefixes
- `feat:` — new feature
- `fix:` — bug fix
- `wip:` — work in progress, acceptable for end-of-session commits
- `chore:` — tooling, deps, config
- `docs:` — documentation only

## Branching
- Branch from `dev`, merge back into `dev`.
- `main` is updated only at milestone completion (`dev` → `main`).
- One feature branch per module/milestone — see the Build Order table in
  `CLAUDE.md` (M1–M5).
- `fix/<short-description>` branches are short-lived, branched from `dev`,
  merged the same session.
- Delete branches after they're merged.

## Session protocol
- Start of session: read `AGENTS.md` and `PROGRESS.md` first.
- End of session: update the "Current status" block in `AGENTS.md`, update
  `PROGRESS.md`, and commit (even WIP work) using the prefixes above.
