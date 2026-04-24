import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let _supabase: SupabaseClient | null = null

// Limpar sessão antiga do Auth (evita erro "Email logins are disabled" ao restaurar sessão)
function clearStaleAuthSession() {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && (k.startsWith('sb-') && k.endsWith('-auth-token') || k.includes('supabase') && k.includes('auth')))
        keys.push(k)
    }
    keys.forEach((k) => localStorage.removeItem(k))
  } catch (_) {}
}

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase nao configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
    }
    clearStaleAuthSession()
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }
  return _supabase
}

// Backward compat: lazy getter so import doesn't crash
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop]
  },
})

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}
