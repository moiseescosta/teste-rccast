alter table public.employees
  add column if not exists is_registered boolean not null default false;

comment on column public.employees.is_registered is
  'Indica se o colaborador esta cadastrado (registro formal acordado com RH).';
