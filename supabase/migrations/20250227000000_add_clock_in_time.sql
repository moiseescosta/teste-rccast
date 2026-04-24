-- Adiciona coluna clock_in_time (Horário de Entrada) na tabela employees
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS clock_in_time TIME;

COMMENT ON COLUMN public.employees.clock_in_time IS 'Horário de entrada padrão do funcionário (ex: 07:00)';
