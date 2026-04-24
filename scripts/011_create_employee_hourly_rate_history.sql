-- Historico de valor por hora (aba Pagamento).
CREATE TABLE IF NOT EXISTS public.employee_hourly_rate_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  hourly_rate DECIMAL(10, 2) NOT NULL,
  effective_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hourly_rate_history_employee
  ON public.employee_hourly_rate_history (employee_id);

ALTER TABLE public.employee_hourly_rate_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_employee_hourly_rate_history" ON public.employee_hourly_rate_history;
CREATE POLICY "allow_all_employee_hourly_rate_history"
  ON public.employee_hourly_rate_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Carga inicial a partir do valor atual (so se a tabela estiver vazia para o funcionario).
INSERT INTO public.employee_hourly_rate_history (employee_id, hourly_rate, effective_date)
SELECT e.id, e.hourly_rate, e.effective_date::date
FROM public.employees e
WHERE e.hourly_rate IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.employee_hourly_rate_history h WHERE h.employee_id = e.id
  );

NOTIFY pgrst, 'reload schema';
