-- Horário de referência na fábrica (opcional). Horários por setor ficam em operation_types (JSON).
ALTER TABLE public.factories
ADD COLUMN IF NOT EXISTS clock_in_time TIME;

COMMENT ON COLUMN public.factories.clock_in_time IS 'Horário opcional da obra; detalhes por setor em operation_types (ex.: name + clock_in_time).';
