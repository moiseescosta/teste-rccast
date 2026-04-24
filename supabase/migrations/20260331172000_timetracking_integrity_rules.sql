-- Time tracking integrity improvements.

-- Normalize legacy statuses.
update public.time_entries
set status = case
  when lower(coalesce(status, '')) in ('registrado', 'completed', 'concluido') then 'completed'
  when lower(coalesce(status, '')) in ('active', 'ativo', 'em_andamento') then 'active'
  else 'completed'
end;

-- Enforce allowed status values.
alter table public.time_entries
  drop constraint if exists chk_time_entries_status;

alter table public.time_entries
  add constraint chk_time_entries_status
  check (status in ('active', 'completed'));

-- Prevent exact duplicate open/closed records for same employee/day/clock pair.
create unique index if not exists uq_time_entries_employee_day_clocks
  on public.time_entries (employee_id, date, coalesce(clock_in::text, ''), coalesce(clock_out::text, ''));

notify pgrst, 'reload schema';
