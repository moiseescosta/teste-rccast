-- ============================================================
-- RLS por tipo de usuário (OPCIONAL)
-- Execute APENAS quando a autenticação estiver ativa no app.
-- Antes de rodar: remova as políticas permissivas de 004_enable_rls.sql
--   DROP POLICY IF EXISTS "allow_all_employees" ON public.employees;
--   DROP POLICY IF EXISTS "allow_all_time_entries" ON public.time_entries;
-- ============================================================

-- Exemplo: Admin e Gerente podem tudo em employees; Funcionario só leitura
CREATE POLICY "employees_admin_gerente_full" ON public.employees
  FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) IN ('Admin', 'Gerente')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) IN ('Admin', 'Gerente')
  );

CREATE POLICY "employees_funcionario_read" ON public.employees
  FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'Funcionario'
  );

-- Exemplo: mesmo critério para time_entries
CREATE POLICY "time_entries_admin_gerente_full" ON public.time_entries
  FOR ALL
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) IN ('Admin', 'Gerente')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) IN ('Admin', 'Gerente')
  );

CREATE POLICY "time_entries_funcionario_read" ON public.time_entries
  FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'Funcionario'
  );
