-- Adiciona colunas para imagens de documentos do funcionário (Passaporte e Driver's License)
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS passport_image_url TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS drivers_license_url TEXT;

COMMENT ON COLUMN public.employees.passport_image_url IS 'URL ou data URL da imagem do passaporte anexada';
COMMENT ON COLUMN public.employees.drivers_license_url IS 'URL ou data URL da imagem da carteira de motorista anexada';
