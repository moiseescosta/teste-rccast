-- ============================================================
-- Tipos de usuário: Admin, Gerente, Funcionário
-- Execute no Supabase (SQL Editor) após 001, 002, 003, 004
-- ============================================================

-- 1. Enum com os três tipos de usuário
DO $$ BEGIN
  CREATE TYPE app_user_role AS ENUM ('Admin', 'Gerente', 'Funcionario');
EXCEPTION
  WHEN duplicate_object THEN NULL; -- já existe
END $$;

-- 2. Tabela de perfis (vinculada ao auth.users do Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_user_role NOT NULL DEFAULT 'Funcionario',
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para buscar por role
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Comentários nas colunas
COMMENT ON TABLE public.profiles IS 'Perfis e tipo de usuário (Admin, Gerente, Funcionario) vinculados ao Supabase Auth';
COMMENT ON COLUMN public.profiles.role IS 'Admin = acesso total; Gerente = gestão; Funcionario = uso básico';

-- 3. Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Usuário pode ler o próprio perfil
CREATE POLICY "users_read_own_profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Apenas Admin pode ver todos os perfis e alterar roles (policy abaixo)
-- Para o primeiro Admin: rode manualmente no SQL Editor após criar o primeiro usuário:
--   UPDATE public.profiles SET role = 'Admin' WHERE id = auth.uid();
-- Ou, para um email específico após o usuário existir em auth.users:
--   UPDATE public.profiles SET role = 'Admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'seu-email@exemplo.com' LIMIT 1);

-- Admins podem ver todos os perfis
CREATE POLICY "admins_read_all_profiles" ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'Admin'
    )
  );

-- Admins podem atualizar qualquer perfil (ex.: alterar role de outro usuário)
CREATE POLICY "admins_update_profiles" ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'Admin'
    )
  )
  WITH CHECK (true);

-- Usuário pode atualizar apenas o próprio perfil (campos como full_name, avatar_url), mas não o role
-- (opcional: use uma policy mais restritiva que bloqueie update de role se id = auth.uid())
CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Trigger: ao criar usuário no Auth, criar perfil com role Funcionario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    'Funcionario',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Só cria o trigger se a função trigger existir (Supabase já pode ter handle_new_user)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Função auxiliar: retorna o role do usuário atual (útil no app)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS app_user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Exemplo de uso no app: SELECT get_my_role();

-- 6. Trigger: só Admin pode alterar o campo role (próprio ou de outros)
CREATE OR REPLACE FUNCTION public.check_role_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) != 'Admin' THEN
      RAISE EXCEPTION 'Apenas Admin pode alterar o tipo de usuário (role).';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_role_change_by_non_admin ON public.profiles;
CREATE TRIGGER prevent_role_change_by_non_admin
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_role_update();
