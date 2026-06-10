# Environment Variables

Never commit real values. See `.env.example` for the full template with
placeholders. Frontend vars go in `.env.local` (gitignored). Edge Function
secrets go in `supabase/functions/.env` locally, or Supabase dashboard →
Edge Functions → Secrets in production (also gitignored).

## Frontend (Vite — bundled into the client, exposed to the browser)
| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon key — safe to expose; RLS enforces access control |

Only variables prefixed `VITE_` are available in frontend code
(`import.meta.env.VITE_...`). Never prefix a secret with `VITE_`.

## Edge Functions (Deno runtime — server-side only, never in client code)
| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Full DB access, bypasses RLS. Edge Functions only — never in browser code |
| `RESEND_API_KEY` | Transactional email via `_shared/email.ts` |
| `APP_ENV` | `development` \| `production` |

## Adding a new variable
1. Add it to `.env.example` with a placeholder value.
2. Add a row to the appropriate table above with a one-line description.
3. If it's a secret, confirm it's only read inside `supabase/functions/`.
