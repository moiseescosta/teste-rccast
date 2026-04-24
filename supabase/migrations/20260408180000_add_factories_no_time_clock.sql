-- Obra sem relógio de ponto no local: colaboradores registram entrada/saída (ex.: quiosque em dois passos).
alter table public.factories
  add column if not exists no_time_clock boolean not null default false;

comment on column public.factories.no_time_clock is
  'Quando true, não há máquina de ponto na obra; o colaborador deve registrar também na entrada.';
