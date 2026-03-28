import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireAuth } from '../../../lib/auth'
import { checkRateLimit } from '../../../lib/rateLimitMiddleware'
import { validateBody, agenciaSchema } from '../../../lib/validation'
import bcrypt from 'bcryptjs'

// GET — superadmin lista todas las agencias
export async function GET(request) {
  const { response } = requireAuth(request, 'superadmin')
  if (response) return response

  const { data, error } = await supabaseAdmin
    .from('agencias')
    .select('id, nombre, email, activo, creado_en')
    .order('creado_en', { ascending: false })

  if (error) return NextResponse.json({ error: 'Error obteniendo agencias' }, { status: 500 })
  return NextResponse.json({ agencias: data || [] })
}

// POST — superadmin crea una agencia
export async function POST(request) {
  const rl = await checkRateLimit(request, { limite: 10, ventanaMs: 60000 })
  if (rl) return rl
  const { response } = requireAuth(request, 'superadmin')
  if (response) return response

  const body = await request.json()
  const { data: validated, response: valErr } = validateBody(body, agenciaSchema)
  if (valErr) return valErr
  const { nombre, email, password } = validated

  const password_hash = await bcrypt.hash(password, 12)

  const { data, error } = await supabaseAdmin
    .from('agencias')
    .insert({ nombre, email, password_hash, activo: true })
    .select('id, nombre, email, activo, creado_en')
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 })
    return NextResponse.json({ error: 'Error creando agencia' }, { status: 500 })
  }

  return NextResponse.json({ agencia: data }, { status: 201 })
}

// PATCH — superadmin activa/desactiva agencia
export async function PATCH(request) {
  const rl = await checkRateLimit(request, { limite: 20, ventanaMs: 60000 })
  if (rl) return rl
  const { response } = requireAuth(request, 'superadmin')
  if (response) return response

  const { id, activo } = await request.json()
  if (!id || activo === undefined) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('agencias').update({ activo }).eq('id', id)
  if (error) return NextResponse.json({ error: 'Error actualizando agencia' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
