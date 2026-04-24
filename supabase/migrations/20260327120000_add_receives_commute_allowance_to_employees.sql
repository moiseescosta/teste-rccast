alter table public.employees
add column if not exists receives_commute_allowance boolean not null default false;

comment on column public.employees.receives_commute_allowance is 'Folha: recebe auxilio de deslocamento';
