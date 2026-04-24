create table if not exists public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  period_label text not null,
  period_start date not null,
  period_end date not null,
  status text not null default 'draft',
  created_by uuid,
  approved_by uuid,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payroll_entries (
  id uuid primary key default gen_random_uuid(),
  payroll_run_id uuid not null references public.payroll_runs(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  regular_hours numeric(10,2) not null default 0,
  overtime_hours numeric(10,2) not null default 0,
  hourly_rate numeric(10,2) not null default 0,
  overtime_multiplier numeric(5,2) not null default 1.5,
  bonuses numeric(10,2) not null default 0,
  deductions numeric(10,2) not null default 0,
  gross_pay numeric(12,2) not null default 0,
  net_pay numeric(12,2) not null default 0,
  notes text,
  status text not null default 'draft',
  pay_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (payroll_run_id, employee_id)
);

create index if not exists idx_payroll_runs_period
  on public.payroll_runs (period_start, period_end);

create index if not exists idx_payroll_entries_employee
  on public.payroll_entries (employee_id);

alter table public.payroll_runs enable row level security;
alter table public.payroll_entries enable row level security;

drop policy if exists "payroll_runs_admin_manager_rw" on public.payroll_runs;
drop policy if exists "payroll_entries_admin_manager_rw" on public.payroll_entries;
drop policy if exists "payroll_entries_employee_read_own" on public.payroll_entries;

create policy "payroll_runs_admin_manager_rw"
on public.payroll_runs
for all
using (public.get_current_employee_role() in ('Admin', 'Gerente'))
with check (public.get_current_employee_role() in ('Admin', 'Gerente'));

create policy "payroll_entries_admin_manager_rw"
on public.payroll_entries
for all
using (public.get_current_employee_role() in ('Admin', 'Gerente'))
with check (public.get_current_employee_role() in ('Admin', 'Gerente'));

create policy "payroll_entries_employee_read_own"
on public.payroll_entries
for select
using (employee_id = public.get_current_employee_id());

comment on table public.payroll_runs is 'Execuções de folha por período.';
comment on table public.payroll_entries is 'Itens de folha por funcionário em cada execução.';

notify pgrst, 'reload schema';
