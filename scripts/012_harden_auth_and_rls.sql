-- Hardening de autenticação e RLS para produção.
-- Rode após os scripts base (001..011).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS system_role TEXT DEFAULT 'Funcionario';

CREATE OR REPLACE FUNCTION public.get_employee_by_login(p_email TEXT, p_password TEXT)
RETURNS TABLE(emp_id UUID, emp_system_role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT e.id AS emp_id, COALESCE(e.system_role, 'Funcionario')::TEXT AS emp_system_role
  FROM public.employees e
  WHERE lower(trim(e.email)) = lower(trim(p_email))
    AND trim(coalesce(p_password, '')) <> ''
    AND e.password_hash IS NOT NULL
    AND e.password_hash = extensions.crypt(p_password, e.password_hash)
    AND coalesce(e.status, 'Ativo') = 'Ativo'
  LIMIT 1;
END;
$$;

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_employees" ON public.employees;
DROP POLICY IF EXISTS "allow_all_time_entries" ON public.time_entries;

CREATE OR REPLACE FUNCTION public.get_current_employee_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT coalesce(e.system_role, 'Funcionario')
  FROM public.employees e
  WHERE lower(e.email) = lower(coalesce(auth.jwt()->>'email', ''))
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_current_employee_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT e.id
  FROM public.employees e
  WHERE lower(e.email) = lower(coalesce(auth.jwt()->>'email', ''))
  LIMIT 1
$$;

CREATE POLICY "employees_admin_manager_all"
ON public.employees
FOR ALL
USING (public.get_current_employee_role() IN ('Admin', 'Gerente'))
WITH CHECK (public.get_current_employee_role() IN ('Admin', 'Gerente'));

CREATE POLICY "employees_employee_read_self"
ON public.employees
FOR SELECT
USING (id = public.get_current_employee_id());

CREATE POLICY "time_entries_admin_manager_all"
ON public.time_entries
FOR ALL
USING (public.get_current_employee_role() IN ('Admin', 'Gerente'))
WITH CHECK (public.get_current_employee_role() IN ('Admin', 'Gerente'));

CREATE POLICY "time_entries_employee_select_own"
ON public.time_entries
FOR SELECT
USING (employee_id = public.get_current_employee_id());

CREATE POLICY "time_entries_employee_insert_own"
ON public.time_entries
FOR INSERT
WITH CHECK (employee_id = public.get_current_employee_id());

NOTIFY pgrst, 'reload schema';
