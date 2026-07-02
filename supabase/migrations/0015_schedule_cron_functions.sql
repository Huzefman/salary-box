-- Schedule all 15 cron functions via pg_cron + pg_net
-- IST = UTC + 5:30, so IST times are converted to UTC in cron expressions

-- First, ensure extensions are available
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Helper: stored secrets for project URL and anon key
-- These are used by net.http_post() to invoke Edge Functions
-- Secrets are created via vault.create_secret() — already done if running fresh

-- 1. access-revocation: daily at 23:55 IST (18:25 UTC)
SELECT cron.schedule(
  'access-revocation',
  '25 18 * * *',
  $$SELECT net.http_post(url:=(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/access-revocation', headers:=jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')), body:='{}'::jsonb) AS request_id;$$
);

-- 2. exit-date-alert: daily at 09:15 IST (03:45 UTC)
SELECT cron.schedule(
  'exit-date-alert',
  '45 3 * * *',
  $$SELECT net.http_post(url:=(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/exit-date-alert', headers:=jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')), body:='{}'::jsonb) AS request_id;$$
);

-- 3. future-joiner-activation: daily at 00:01 IST (18:31 UTC previous day)
SELECT cron.schedule(
  'future-joiner-activation',
  '31 18 * * *',
  $$SELECT net.http_post(url:=(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/future-joiner-activation', headers:=jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')), body:='{}'::jsonb) AS request_id;$$
);

-- 4. auto-checkout: daily at 20:00 IST (14:30 UTC)
SELECT cron.schedule(
  'auto-checkout',
  '30 14 * * *',
  $$SELECT net.http_post(url:=(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/auto-checkout', headers:=jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')), body:='{}'::jsonb) AS request_id;$$
);

-- 5. late-mark-deduction: monthly on 1st at 01:00 IST (19:30 UTC previous day)
SELECT cron.schedule(
  'late-mark-deduction',
  '30 19 1 * *',
  $$SELECT net.http_post(url:=(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/late-mark-deduction', headers:=jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')), body:='{}'::jsonb) AS request_id;$$
);

-- 6. incomplete-attendance-reminder: daily at 20:00 IST (14:30 UTC)
SELECT cron.schedule(
  'incomplete-attendance-reminder',
  '30 14 * * *',
  $$SELECT net.http_post(url:=(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/incomplete-attendance-reminder', headers:=jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')), body:='{}'::jsonb) AS request_id;$$
);

-- 7. compute-attendance-status: daily at 20:30 IST (15:00 UTC)
SELECT cron.schedule(
  'compute-attendance-status',
  '0 15 * * *',
  $$SELECT net.http_post(url:=(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/compute-attendance-status', headers:=jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')), body:='{}'::jsonb) AS request_id;$$
);

-- 8. monthly-leave-accrual: monthly on 1st at 01:00 IST (19:30 UTC previous day)
SELECT cron.schedule(
  'monthly-leave-accrual',
  '30 19 1 * *',
  $$SELECT net.http_post(url:=(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/monthly-leave-accrual', headers:=jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')), body:='{}'::jsonb) AS request_id;$$
);

-- 9. year-end-leave-rollover: yearly on Jan 1 at 01:00 IST (Dec 31 19:30 UTC)
SELECT cron.schedule(
  'year-end-leave-rollover',
  '30 19 31 12 *',
  $$SELECT net.http_post(url:=(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/year-end-leave-rollover', headers:=jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')), body:='{}'::jsonb) AS request_id;$$
);

-- 10. leave-sla-escalation: daily at 10:00 IST (04:30 UTC)
SELECT cron.schedule(
  'leave-sla-escalation',
  '30 4 * * *',
  $$SELECT net.http_post(url:=(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/leave-sla-escalation', headers:=jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')), body:='{}'::jsonb) AS request_id;$$
);

-- 11. carry-forward-expiry-alert: daily at 08:00 IST (02:30 UTC)
SELECT cron.schedule(
  'carry-forward-expiry-alert',
  '30 2 * * *',
  $$SELECT net.http_post(url:=(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/carry-forward-expiry-alert', headers:=jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')), body:='{}'::jsonb) AS request_id;$$
);

-- 12. carry-forward-lapse: daily at 02:00 IST (20:30 UTC)
SELECT cron.schedule(
  'carry-forward-lapse',
  '30 20 * * *',
  $$SELECT net.http_post(url:=(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/carry-forward-lapse', headers:=jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')), body:='{}'::jsonb) AS request_id;$$
);

-- 13. comp-off-expiry-alert: daily at 08:30 IST (03:00 UTC)
SELECT cron.schedule(
  'comp-off-expiry-alert',
  '0 3 * * *',
  $$SELECT net.http_post(url:=(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/comp-off-expiry-alert', headers:=jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')), body:='{}'::jsonb) AS request_id;$$
);

-- 14. comp-off-lapse: daily at 02:30 IST (21:00 UTC)
SELECT cron.schedule(
  'comp-off-lapse',
  '0 21 * * *',
  $$SELECT net.http_post(url:=(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/comp-off-lapse', headers:=jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')), body:='{}'::jsonb) AS request_id;$$
);

-- 15. probation-end-alert: daily at 09:00 IST (03:30 UTC)
SELECT cron.schedule(
  'probation-end-alert',
  '30 3 * * *',
  $$SELECT net.http_post(url:=(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/probation-end-alert', headers:=jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')), body:='{}'::jsonb) AS request_id;$$
);
