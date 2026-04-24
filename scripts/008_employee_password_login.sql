-- ============================================================
-- Senha e login por e-mail na tabela employees
-- Execute no Supabase (SQL Editor) após 001, 005 (ou 007).
-- Resolve: "E-mail ou senha incorretos" ao logar com usuário novo.
-- ============================================================

-- 1. Habilitar extensão para hash de senha (bcrypt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Coluna para tipo de usuário (Admin, Gerente, Funcionario) se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'system_role'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN system_role TEXT DEFAULT 'Funcionario';
    COMMENT ON COLUMN public.employees.system_role IS 'Tipo de acesso: Admin, Gerente ou Funcionario';
  END IF;
END $$;

-- 3. Coluna para hash da senha (login sem Supabase Auth)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN password_hash TEXT;
    COMMENT ON COLUMN public.employees.password_hash IS 'Hash bcrypt da senha para login (get_employee_by_login)';
  END IF;
END $$;

-- 4. Função de login: retorna emp_id e emp_system_role se e-mail e senha estiverem corretos
-- Aceita: (1) bcrypt, (2) senha em texto puro (compat), (3) password_hash NULL = qualquer senha (compat usuários antigos)
-- IMPORTANTE: Supabase instala pgcrypto no schema "extensions" – use search_path = public, extensions
CREATE OR REPLACE FUNCTION public.get_employee_by_login(p_email TEXT, p_password TEXT)
RETURNS TABLE(emp_id UUID, emp_system_role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT e.id AS emp_id, COALESCE(e.system_role, 'Funcionario')::TEXT AS emp_system_role
  FROM public.employees e
  WHERE lower(trim(e.email)) = lower(trim(p_email))
    AND trim(coalesce(p_password, '')) != ''
    AND (
      (e.password_hash IS NOT NULL AND e.password_hash = extensions.crypt(p_password, e.password_hash))
      OR (e.password_hash IS NOT NULL AND e.password_hash = p_password)
      OR (e.password_hash IS NULL)
    )
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.get_employee_by_login(TEXT, TEXT) IS 'Login por e-mail e senha na tabela employees. Retorna emp_id e emp_system_role.';

-- 5. Função para definir/alterar senha do funcionário (usada ao cadastrar ou editar)
-- Supabase: pgcrypto está no schema extensions – use extensions.crypt e extensions.gen_salt
CREATE OR REPLACE FUNCTION public.set_employee_password(p_employee_id UUID, p_password TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF trim(coalesce(p_password, '')) = '' THEN
    RETURN;
  END IF;
  UPDATE public.employees
  SET password_hash = extensions.crypt(p_password, extensions.gen_salt('bf')),
      updated_at = now()
  WHERE id = p_employee_id;
END;
$$;

COMMENT ON FUNCTION public.set_employee_password(UUID, TEXT) IS 'Define ou altera a senha do funcionário (hash bcrypt). Chamada pelo app ao cadastrar/editar usuário.';
