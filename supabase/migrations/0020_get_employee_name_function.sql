-- SECURITY DEFINER function to look up any employee by ID without RLS.
-- Used by the frontend to fetch the reporting manager's name for display
-- on employee profile pages. This is a minimal, targeted function that
-- only returns id, first_name, last_name — no sensitive data.

create or replace function public.get_employee_name(p_id uuid)
returns table (id uuid, first_name text, last_name text)
language sql
security definer
stable
set search_path = public
as $$
  select id, first_name, last_name from employees where id = p_id
$$;
