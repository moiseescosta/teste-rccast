/**
 * Cria o usuário admin no Supabase e define role Admin no perfil.
 * Uso: node scripts/create-admin-user.mjs
 * Lê .env na raiz do projeto (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env ou no ambiente.');
  process.exit(1);
}

const supabase = createClient(url, anonKey);

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = '123456';

async function main() {
  console.log('Criando usuário admin...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    options: { emailRedirectTo: undefined },
  });

  if (signUpError) {
    if (signUpError.message?.includes('already registered')) {
      console.log('Usuário já existe. Atualizando perfil para Admin...');
    } else {
      console.error('Erro ao criar usuário:', signUpError.message);
      process.exit(1);
    }
  } else if (signUpData?.user) {
    console.log('Usuário criado:', signUpData.user.id);
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (signInError) {
    console.error('Erro ao entrar (confirme o e-mail se a confirmação estiver ativa):', signInError.message);
    process.exit(1);
  }

  const userId = signInData.user.id;
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'Admin' })
    .eq('id', userId);

  if (updateError) {
    console.error('Erro ao definir role Admin:', updateError.message);
    process.exit(1);
  }

  console.log('Ok. Admin configurado:');
  console.log('  E-mail:', ADMIN_EMAIL);
  console.log('  Senha:', ADMIN_PASSWORD);
  console.log('  Role: Admin');
}

main();
