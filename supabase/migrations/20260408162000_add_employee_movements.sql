alter table public.employees
  add column if not exists employee_movements jsonb not null default '[]'::jsonb;

comment on column public.employees.employee_movements is
  'Movimentacoes temporarias do funcionario entre fabricas/obras (periodo, horario e observacao).';
