-- Tabela de fábricas/obras para o Supabase.
-- Execute este SQL no Supabase: SQL Editor > New query > Cole e rode.

create table if not exists public.factories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  status text not null default 'Ativo',
  country text not null default 'Estados Unidos',
  state text not null,
  city text not null,
  address text not null,
  notes text,
  operation_types jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para buscas
create index if not exists idx_factories_code on public.factories (code);
create index if not exists idx_factories_name on public.factories (name);

-- RLS (Row Level Security): permitir leitura e escrita para usuários autenticados ou anon conforme sua política.
-- Se você usa apenas service_role/anon sem auth, pode desabilitar RLS ou criar políticas.
alter table public.factories enable row level security;

-- Política: permitir tudo para anon e authenticated (ajuste conforme sua segurança).
create policy "Allow all for factories"
  on public.factories
  for all
  using (true)
  with check (true);

-- Comentário
comment on table public.factories is 'Fábricas/obras cadastradas no sistema';
