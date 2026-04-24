-- Habilitar RLS nas tabelas
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Politica permissiva para acesso via anon key (sistema interno sem auth por enquanto)
-- Quando adicionar autenticacao, substitua estas politicas por regras baseadas em auth.uid()
CREATE POLICY "allow_all_employees" ON public.employees
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_all_time_entries" ON public.time_entries
  FOR ALL
  USING (true)
  WITH CHECK (true);
