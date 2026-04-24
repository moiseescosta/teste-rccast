-- Compatibility mode for legacy app flow (no Supabase Auth session).

DROP POLICY IF EXISTS "legacy_employees_anon_all" ON public.employees;
CREATE POLICY "legacy_employees_anon_all" ON public.employees FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "legacy_employees_authenticated_all" ON public.employees;
CREATE POLICY "legacy_employees_authenticated_all" ON public.employees FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "legacy_time_entries_anon_all" ON public.time_entries;
CREATE POLICY "legacy_time_entries_anon_all" ON public.time_entries FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "legacy_time_entries_authenticated_all" ON public.time_entries;
CREATE POLICY "legacy_time_entries_authenticated_all" ON public.time_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "legacy_factories_anon_all" ON public.factories;
CREATE POLICY "legacy_factories_anon_all" ON public.factories FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "legacy_factories_authenticated_all" ON public.factories;
CREATE POLICY "legacy_factories_authenticated_all" ON public.factories FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "legacy_notifications_anon_all" ON public.notifications;
CREATE POLICY "legacy_notifications_anon_all" ON public.notifications FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "legacy_notifications_authenticated_all" ON public.notifications;
CREATE POLICY "legacy_notifications_authenticated_all" ON public.notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "legacy_hourly_rate_history_anon_all" ON public.employee_hourly_rate_history;
CREATE POLICY "legacy_hourly_rate_history_anon_all" ON public.employee_hourly_rate_history FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "legacy_hourly_rate_history_authenticated_all" ON public.employee_hourly_rate_history;
CREATE POLICY "legacy_hourly_rate_history_authenticated_all" ON public.employee_hourly_rate_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "legacy_payroll_runs_anon_all" ON public.payroll_runs;
CREATE POLICY "legacy_payroll_runs_anon_all" ON public.payroll_runs FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "legacy_payroll_runs_authenticated_all" ON public.payroll_runs;
CREATE POLICY "legacy_payroll_runs_authenticated_all" ON public.payroll_runs FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "legacy_payroll_entries_anon_all" ON public.payroll_entries;
CREATE POLICY "legacy_payroll_entries_anon_all" ON public.payroll_entries FOR ALL TO anon USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "legacy_payroll_entries_authenticated_all" ON public.payroll_entries;
CREATE POLICY "legacy_payroll_entries_authenticated_all" ON public.payroll_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
