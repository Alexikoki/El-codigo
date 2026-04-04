import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente con service role para operaciones del servidor
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!serviceRoleKey && process.env.NODE_ENV === 'production') throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurado')
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)