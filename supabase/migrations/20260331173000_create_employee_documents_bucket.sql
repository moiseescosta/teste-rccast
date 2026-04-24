insert into storage.buckets (id, name, public)
values ('employee-documents', 'employee-documents', false)
on conflict (id) do nothing;

-- Managers/admins can manage all docs.
drop policy if exists "employee_docs_admin_manager_all" on storage.objects;
create policy "employee_docs_admin_manager_all"
on storage.objects
for all
using (
  bucket_id = 'employee-documents'
  and public.get_current_employee_role() in ('Admin', 'Gerente')
)
with check (
  bucket_id = 'employee-documents'
  and public.get_current_employee_role() in ('Admin', 'Gerente')
);

-- Employees can read only their own folder.
drop policy if exists "employee_docs_employee_read_own" on storage.objects;
create policy "employee_docs_employee_read_own"
on storage.objects
for select
using (
  bucket_id = 'employee-documents'
  and (storage.foldername(name))[1] = coalesce(public.get_current_employee_id()::text, '')
);
