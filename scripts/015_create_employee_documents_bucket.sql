-- Bucket seguro para documentos de funcionários.
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-documents', 'employee-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "employee_docs_admin_manager_all" ON storage.objects;
CREATE POLICY "employee_docs_admin_manager_all"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'employee-documents'
  AND public.get_current_employee_role() IN ('Admin', 'Gerente')
)
WITH CHECK (
  bucket_id = 'employee-documents'
  AND public.get_current_employee_role() IN ('Admin', 'Gerente')
);

DROP POLICY IF EXISTS "employee_docs_employee_read_own" ON storage.objects;
CREATE POLICY "employee_docs_employee_read_own"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'employee-documents'
  AND (storage.foldername(name))[1] = coalesce(public.get_current_employee_id()::text, '')
);
