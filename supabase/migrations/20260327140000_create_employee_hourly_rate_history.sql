create table if not exists public.employee_hourly_rate_history (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  hourly_rate decimal(10, 2) not null,
  effective_date date,
  created_at timestamptz not null default now()
);

create index if not exists idx_hourly_rate_history_employee
  on public.employee_hourly_rate_history (employee_id);

alter table public.employee_hourly_rate_history enable row level security;

drop policy if exists "allow_all_employee_hourly_rate_history" on public.employee_hourly_rate_history;
create policy "allow_all_employee_hourly_rate_history"
  on public.employee_hourly_rate_history
  for all
  using (true)
  with check (true);

comment on table public.employee_hourly_rate_history is 'Historico de valor por hora do funcionario';

insert into public.employee_hourly_rate_history (employee_id, hourly_rate, effective_date)
select e.id, e.hourly_rate, e.effective_date::date
from public.employees e
where e.hourly_rate is not null
  and not exists (
    select 1 from public.employee_hourly_rate_history h where h.employee_id = e.id
  );

notify pgrst, 'reload schema';
