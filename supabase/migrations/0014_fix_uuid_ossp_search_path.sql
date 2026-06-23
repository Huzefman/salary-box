-- The log_changes trigger function is SECURITY DEFINER with search_path=public,
-- but uuid_generate_v5 lives in the extensions schema. PostgreSQL can't find
-- it at trigger-execution time.
-- Fix: create a public wrapper that delegates to extensions.uuid_generate_v5.
CREATE OR REPLACE FUNCTION public.uuid_generate_v5(namespace uuid, name text)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
AS $_$
  SELECT extensions.uuid_generate_v5(namespace, name);
$_$;
