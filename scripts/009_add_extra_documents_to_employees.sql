-- Adiciona suporte a documentos extras no cadastro de funcionarios.
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS extra_documents JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.employees.extra_documents IS 'Documentos extras [{id,title,image_url}]';
