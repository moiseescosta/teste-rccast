DROP POLICY IF EXISTS "Authenticated can delete employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated can read employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated can update employees" ON public.employees;
DROP POLICY IF EXISTS "anon_delete_employees" ON public.employees;
DROP POLICY IF EXISTS "anon_insert_employees" ON public.employees;
DROP POLICY IF EXISTS "anon_read_employees" ON public.employees;
DROP POLICY IF EXISTS "anon_update_employees" ON public.employees;

DROP POLICY IF EXISTS "Authenticated can delete time_entries" ON public.time_entries;
DROP POLICY IF EXISTS "Authenticated can insert time_entries" ON public.time_entries;
DROP POLICY IF EXISTS "Authenticated can read time_entries" ON public.time_entries;
DROP POLICY IF EXISTS "Authenticated can update time_entries" ON public.time_entries;
DROP POLICY IF EXISTS "anon_delete_time_entries" ON public.time_entries;
DROP POLICY IF EXISTS "anon_insert_time_entries" ON public.time_entries;
DROP POLICY IF EXISTS "anon_read_time_entries" ON public.time_entries;
DROP POLICY IF EXISTS "anon_update_time_entries" ON public.time_entries;

NOTIFY pgrst, 'reload schema';
