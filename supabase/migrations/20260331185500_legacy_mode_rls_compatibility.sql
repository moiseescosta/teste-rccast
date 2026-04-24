-- Compatibility mode for legacy app flow (no Supabase Auth session).
-- Keeps app functional while auth migration to Supabase Auth is pending.

drop policy if exists "legacy_employees_anon_all" on public.employees;
create policy "legacy_employees_anon_all"
on public.employees
for all
to anon
using (true)
with check (true);

drop policy if exists "legacy_employees_authenticated_all" on public.employees;
create policy "legacy_employees_authenticated_all"
on public.employees
for all
to authenticated
using (true)
with check (true);

drop policy if exists "legacy_time_entries_anon_all" on public.time_entries;
create policy "legacy_time_entries_anon_all"
on public.time_entries
for all
to anon
using (true)
with check (true);

drop policy if exists "legacy_time_entries_authenticated_all" on public.time_entries;
create policy "legacy_time_entries_authenticated_all"
on public.time_entries
for all
to authenticated
using (true)
with check (true);

drop policy if exists "legacy_factories_anon_all" on public.factories;
create policy "legacy_factories_anon_all"
on public.factories
for all
to anon
using (true)
with check (true);

drop policy if exists "legacy_factories_authenticated_all" on public.factories;
create policy "legacy_factories_authenticated_all"
on public.factories
for all
to authenticated
using (true)
with check (true);

drop policy if exists "legacy_notifications_anon_all" on public.notifications;
create policy "legacy_notifications_anon_all"
on public.notifications
for all
to anon
using (true)
with check (true);

drop policy if exists "legacy_notifications_authenticated_all" on public.notifications;
create policy "legacy_notifications_authenticated_all"
on public.notifications
for all
to authenticated
using (true)
with check (true);

drop policy if exists "legacy_hourly_rate_history_anon_all" on public.employee_hourly_rate_history;
create policy "legacy_hourly_rate_history_anon_all"
on public.employee_hourly_rate_history
for all
to anon
using (true)
with check (true);

drop policy if exists "legacy_hourly_rate_history_authenticated_all" on public.employee_hourly_rate_history;
create policy "legacy_hourly_rate_history_authenticated_all"
on public.employee_hourly_rate_history
for all
to authenticated
using (true)
with check (true);

drop policy if exists "legacy_payroll_runs_anon_all" on public.payroll_runs;
create policy "legacy_payroll_runs_anon_all"
on public.payroll_runs
for all
to anon
using (true)
with check (true);

drop policy if exists "legacy_payroll_runs_authenticated_all" on public.payroll_runs;
create policy "legacy_payroll_runs_authenticated_all"
on public.payroll_runs
for all
to authenticated
using (true)
with check (true);

drop policy if exists "legacy_payroll_entries_anon_all" on public.payroll_entries;
create policy "legacy_payroll_entries_anon_all"
on public.payroll_entries
for all
to anon
using (true)
with check (true);

drop policy if exists "legacy_payroll_entries_authenticated_all" on public.payroll_entries;
create policy "legacy_payroll_entries_authenticated_all"
on public.payroll_entries
for all
to authenticated
using (true)
with check (true);

notify pgrst, 'reload schema';
