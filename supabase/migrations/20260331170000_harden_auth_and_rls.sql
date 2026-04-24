-- Security hardening baseline for production.
-- Note: app login still uses employees RPC; this migration removes insecure fallbacks.

create extension if not exists pgcrypto;

-- Ensure required auth columns exist.
alter table public.employees
  add column if not exists password_hash text;

alter table public.employees
  add column if not exists system_role text default 'Funcionario';

-- Harden login function: bcrypt only, no plain text and no NULL password bypass.
create or replace function public.get_employee_by_login(p_email text, p_password text)
returns table(emp_id uuid, emp_system_role text)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  select e.id as emp_id, coalesce(e.system_role, 'Funcionario')::text as emp_system_role
  from public.employees e
  where lower(trim(e.email)) = lower(trim(p_email))
    and trim(coalesce(p_password, '')) <> ''
    and e.password_hash is not null
    and e.password_hash = extensions.crypt(p_password, e.password_hash)
    and coalesce(e.status, 'Ativo') = 'Ativo'
  limit 1;
end;
$$;

comment on function public.get_employee_by_login(text, text)
is 'Hardened login: bcrypt only + active employee check.';

-- Enable RLS in core tables.
alter table public.employees enable row level security;
alter table public.time_entries enable row level security;
alter table public.factories enable row level security;
alter table public.notifications enable row level security;
alter table public.employee_hourly_rate_history enable row level security;

-- Cleanup permissive policies from older scripts/migrations.
drop policy if exists "allow_all_employees" on public.employees;
drop policy if exists "allow_all_time_entries" on public.time_entries;
drop policy if exists "Allow all for factories" on public.factories;
drop policy if exists "Allow all for notifications" on public.notifications;
drop policy if exists "allow_all_employee_hourly_rate_history" on public.employee_hourly_rate_history;

-- Role helper based on auth email -> employees.
create or replace function public.get_current_employee_role()
returns text
language sql
security definer
stable
as $$
  select coalesce(e.system_role, 'Funcionario')
  from public.employees e
  where lower(e.email) = lower(coalesce(auth.jwt()->>'email', ''))
  limit 1
$$;

create or replace function public.get_current_employee_id()
returns uuid
language sql
security definer
stable
as $$
  select e.id
  from public.employees e
  where lower(e.email) = lower(coalesce(auth.jwt()->>'email', ''))
  limit 1
$$;

-- Policies: Admin/Gerente full access; Funcionario restricted to own data.
create policy "employees_admin_manager_all"
on public.employees
for all
using (public.get_current_employee_role() in ('Admin', 'Gerente'))
with check (public.get_current_employee_role() in ('Admin', 'Gerente'));

create policy "employees_employee_read_self"
on public.employees
for select
using (id = public.get_current_employee_id());

create policy "time_entries_admin_manager_all"
on public.time_entries
for all
using (public.get_current_employee_role() in ('Admin', 'Gerente'))
with check (public.get_current_employee_role() in ('Admin', 'Gerente'));

create policy "time_entries_employee_select_own"
on public.time_entries
for select
using (employee_id = public.get_current_employee_id());

create policy "time_entries_employee_insert_own"
on public.time_entries
for insert
with check (employee_id = public.get_current_employee_id());

create policy "time_entries_employee_update_own"
on public.time_entries
for update
using (employee_id = public.get_current_employee_id())
with check (employee_id = public.get_current_employee_id());

create policy "factories_admin_manager_rw"
on public.factories
for all
using (public.get_current_employee_role() in ('Admin', 'Gerente'))
with check (public.get_current_employee_role() in ('Admin', 'Gerente'));

create policy "factories_employee_read"
on public.factories
for select
using (public.get_current_employee_role() = 'Funcionario');

create policy "notifications_admin_manager_rw"
on public.notifications
for all
using (public.get_current_employee_role() in ('Admin', 'Gerente'))
with check (public.get_current_employee_role() in ('Admin', 'Gerente'));

create policy "notifications_employee_read"
on public.notifications
for select
using (public.get_current_employee_role() = 'Funcionario');

create policy "hourly_rate_history_admin_manager_rw"
on public.employee_hourly_rate_history
for all
using (public.get_current_employee_role() in ('Admin', 'Gerente'))
with check (public.get_current_employee_role() in ('Admin', 'Gerente'));

create policy "hourly_rate_history_employee_read_own"
on public.employee_hourly_rate_history
for select
using (employee_id = public.get_current_employee_id());

notify pgrst, 'reload schema';
