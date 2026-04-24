-- Regras de integridade do ponto.

UPDATE public.time_entries
SET status = CASE
  WHEN lower(coalesce(status, '')) IN ('registrado', 'completed', 'concluido') THEN 'completed'
  WHEN lower(coalesce(status, '')) IN ('active', 'ativo', 'em_andamento') THEN 'active'
  ELSE 'completed'
END;

ALTER TABLE public.time_entries
  DROP CONSTRAINT IF EXISTS chk_time_entries_status;

ALTER TABLE public.time_entries
  ADD CONSTRAINT chk_time_entries_status
  CHECK (status IN ('active', 'completed'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_time_entries_employee_day_clocks
  ON public.time_entries (employee_id, date, coalesce(clock_in::text, ''), coalesce(clock_out::text, ''));

NOTIFY pgrst, 'reload schema';
