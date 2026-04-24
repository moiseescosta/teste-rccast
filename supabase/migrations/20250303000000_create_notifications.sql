-- Tabela de notificações: admins/gerentes criam avisos que aparecem para os funcionários.
-- Execute no Supabase: SQL Editor > New query > Cole e rode.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_by uuid references public.employees(id) on delete set null,
  target text not null default 'funcionarios',
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_created_at on public.notifications (created_at desc);
create index if not exists idx_notifications_target on public.notifications (target);

alter table public.notifications enable row level security;

create policy "Allow all for notifications"
  on public.notifications
  for all
  using (true)
  with check (true);

comment on table public.notifications is 'Notificações/avisos criados por admins e gerentes para exibir aos funcionários';

-- Atualiza o cache do PostgREST para reconhecer a nova tabela (evita "Could not find the table in the schema cache")
NOTIFY pgrst, 'reload schema';
SELECT pg_notification_queue_usage();
