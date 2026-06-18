-- Profile Edit Requests
-- Employees can request changes to their own profile, HR/Owner approves or rejects.

CREATE TABLE IF NOT EXISTS public.profile_edit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE NO ACTION,
  requested_changes JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.employees(id) ON DELETE NO ACTION,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_edit_requests ENABLE ROW LEVEL SECURITY;

-- Employee can insert their own requests
CREATE POLICY "employees_insert_own_requests" ON public.profile_edit_requests
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT auth_id FROM public.employees WHERE id = employee_id AND is_active = true)
  );

-- Employee can view their own requests
CREATE POLICY "employees_view_own_requests" ON public.profile_edit_requests
  FOR SELECT USING (
    auth.uid() IN (SELECT auth_id FROM public.employees WHERE id = employee_id)
  );

-- Owner/HR can view all requests
CREATE POLICY "owner_hr_view_all_requests" ON public.profile_edit_requests
  FOR SELECT USING (
    auth.uid() IN (
      SELECT auth_id FROM public.employees
      WHERE role IN ('owner', 'hr') AND is_active = true
    )
  );

-- Owner/HR can update (approve/reject) requests
CREATE POLICY "owner_hr_review_requests" ON public.profile_edit_requests
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT auth_id FROM public.employees
      WHERE role IN ('owner', 'hr') AND is_active = true
    )
  );
