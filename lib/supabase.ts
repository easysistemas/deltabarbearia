
import { createClient } from '@supabase/supabase-js'

// Valores de placeholder para evitar que o Vercel quebre o build (prerender) se as variáveis de ambiente ainda não estiverem configuradas lá.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://build-placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "build-placeholder-key"

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn("Supabase URL or Anon Key is missing. Using placeholders for build time.")
}

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey
)
