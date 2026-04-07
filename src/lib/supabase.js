import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anon) {
  console.warn(
    'Buzzer: Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env for Supabase.',
  )
}

export const supabase = createClient(url || '', anon || '', {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,
    persistSession: true,
  },
})
