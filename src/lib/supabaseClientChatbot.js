import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_CHATBOT_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_CHATBOT_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Chatbot: Missing VITE_SUPABASE_CHATBOT_URL or VITE_SUPABASE_CHATBOT_ANON_KEY')
}

export const supabaseChatbot = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: { persistSession: false },
})
