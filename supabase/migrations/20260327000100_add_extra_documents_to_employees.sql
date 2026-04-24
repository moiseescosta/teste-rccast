alter table public.employees
add column if not exists extra_documents jsonb not null default '[]'::jsonb;

comment on column public.employees.extra_documents is 'Documentos extras do funcionario [{id,title,image_url}]';
