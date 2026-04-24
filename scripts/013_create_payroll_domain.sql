-- Domínio transacional da folha.

CREATE TABLE IF NOT EXISTS public.payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_label TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID,
  approved_by UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payroll_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  regular_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  overtime_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  overtime_multiplier NUMERIC(5,2) NOT NULL DEFAULT 1.5,
  bonuses NUMERIC(10,2) NOT NULL DEFAULT 0,
  deductions NUMERIC(10,2) NOT NULL DEFAULT 0,
  gross_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  pay_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (payroll_run_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_payroll_runs_period ON public.payroll_runs (period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_entries_employee ON public.payroll_entries (employee_id);

ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payroll_runs_admin_manager_rw" ON public.payroll_runs;
DROP POLICY IF EXISTS "payroll_entries_admin_manager_rw" ON public.payroll_entries;
DROP POLICY IF EXISTS "payroll_entries_employee_read_own" ON public.payroll_entries;

CREATE POLICY "payroll_runs_admin_manager_rw"
ON public.payroll_runs
FOR ALL
USING (public.get_current_employee_role() IN ('Admin', 'Gerente'))
WITH CHECK (public.get_current_employee_role() IN ('Admin', 'Gerente'));

CREATE POLICY "payroll_entries_admin_manager_rw"
ON public.payroll_entries
FOR ALL
USING (public.get_current_employee_role() IN ('Admin', 'Gerente'))
WITH CHECK (public.get_current_employee_role() IN ('Admin', 'Gerente'));

CREATE POLICY "payroll_entries_employee_read_own"
ON public.payroll_entries
FOR SELECT
USING (employee_id = public.get_current_employee_id());

NOTIFY pgrst, 'reload schema';
