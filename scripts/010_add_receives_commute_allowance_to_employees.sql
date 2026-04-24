-- Auxilio de deslocamento na aba Pagamento (checkbox).
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS receives_commute_allowance BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.employees.receives_commute_allowance IS 'Folha: recebe auxilio de deslocamento';
