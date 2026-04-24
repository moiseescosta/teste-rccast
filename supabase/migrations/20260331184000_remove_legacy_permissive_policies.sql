drop policy if exists "Authenticated can delete employees" on public.employees;
drop policy if exists "Authenticated can insert employees" on public.employees;
drop policy if exists "Authenticated can read employees" on public.employees;
drop policy if exists "Authenticated can update employees" on public.employees;
drop policy if exists "anon_delete_employees" on public.employees;
drop policy if exists "anon_insert_employees" on public.employees;
drop policy if exists "anon_read_employees" on public.employees;
drop policy if exists "anon_update_employees" on public.employees;

drop policy if exists "Authenticated can delete time_entries" on public.time_entries;
drop policy if exists "Authenticated can insert time_entries" on public.time_entries;
drop policy if exists "Authenticated can read time_entries" on public.time_entries;
drop policy if exists "Authenticated can update time_entries" on public.time_entries;
drop policy if exists "anon_delete_time_entries" on public.time_entries;
drop policy if exists "anon_insert_time_entries" on public.time_entries;
drop policy if exists "anon_read_time_entries" on public.time_entries;
drop policy if exists "anon_update_time_entries" on public.time_entries;

notify pgrst, 'reload schema';
