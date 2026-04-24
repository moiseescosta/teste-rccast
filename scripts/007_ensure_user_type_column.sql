-- ============================================================
-- Garantir coluna "tipo de usuário" (role) no Supabase
-- A verificação do tipo (Admin, Gerente, Funcionario) é feita no banco.
-- Execute no SQL Editor se ainda não rodou o 005 ou se a coluna não existir.
-- ============================================================

-- 1. Tipo (enum) para o tipo de usuário
DO $$ BEGIN
  CREATE TYPE app_user_role AS ENUM ('Admin', 'Gerente', 'Funcionario');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Se a tabela profiles não existir, criar com a coluna role
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_user_role NOT NULL DEFAULT 'Funcionario',
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Se a tabela já existir mas não tiver a coluna "role", adicionar
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN role app_user_role NOT NULL DEFAULT 'Funcionario';
  END IF;
END $$;

-- Índice para buscar por tipo de usuário
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

COMMENT ON COLUMN public.profiles.role IS 'Tipo de usuário: Admin, Gerente ou Funcionario. A verificação no login usa esta coluna.';

-- 4. Função que o app usa para verificar o tipo do usuário logado (no Supabase)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS app_user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Uso: após o login, o app chama supabase.rpc('get_my_role') e o Supabase retorna o tipo (Admin, Gerente ou Funcionario).
