-- Use este script se a tabela notifications já existe mas ainda aparece
-- "Could not find the table 'public.notifications' in the schema cache".
-- Execute no Supabase: SQL Editor > New query > Cole e rode.

NOTIFY pgrst, 'reload schema';
SELECT pg_notification_queue_usage();
