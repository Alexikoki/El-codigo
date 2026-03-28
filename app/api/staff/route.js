import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireAuth } from '../../../lib/auth'
import { checkRateLimit } from '../../../lib/rateLimitMiddleware'
import { validateBody, staffSchema } from '../../../lib/validation'
import bcrypt from 'bcryptjs'

export async function GET(request) {
  const { response } = requireAuth(request, 'superadmin')
  if (response) return response

  const { data } = await supabaseAdmin
    .from('staff')
    .select('*, lugares(nombre)')
    .order('created_at', { ascending: false })

  return NextResponse.json({ staff: data || [] })
}

export async function POST(request) {
  const rl = await checkRateLimit(request, { limite: 10, ventanaMs: 60000 })
  if (rl) return rl
  const { response } = requireAuth(request, 'superadmin')
  if (response) return response

  const body = await request.json()
  const { data: validated, response: valErr } = validateBody(body, staffSchema)
  if (valErr) return valErr
  const { nombre, email, password, lugar_id } = validated

  const password_hash = await bcrypt.hash(password, 12)

  const { data, error } = await supabaseAdmin
    .from('staff')
    .insert({ nombre, email, password_hash, lugar_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al crear' }, { status: 500 })
  return NextResponse.json({ staff: data }, { status: 201 })
}
