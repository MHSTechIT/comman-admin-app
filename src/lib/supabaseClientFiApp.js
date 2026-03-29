import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_FI_APP_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_FI_APP_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Fi App: Missing VITE_SUPABASE_FI_APP_URL or VITE_SUPABASE_FI_APP_ANON_KEY in .env')
}

export const supabaseFiApp = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } })
  : null

