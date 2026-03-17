import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { verificarToken, extraerTokenDeCookie } from '../../../../lib/jwt'
import bcrypt from 'bcryptjs'

// GET — lista el staff del local del manager
export async function GET(request) {
  const payload = verificarToken(extraerTokenDeCookie(request))
  if (!payload || payload.rol !== 'manager') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data } = await supabaseAdmin
    .from('staff')
    .select('id, nombre, email, activo, created_at')
    .eq('lugar_id', payload.lugarId)
    .order('created_at', { ascending: false })

  return NextResponse.json({ staff: data || [] })
}

// POST — crea un nuevo camarero en el local del manager
export async function POST(request) {
  const payload = verificarToken(extraerTokenDeCookie(request))
  if (!payload || payload.rol !== 'manager') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { nombre, email, password } = await request.json()
  if (!nombre || !email || !password || password.length < 6) {
    return NextResponse.json({ error: 'Faltan datos o contraseña demasiado corta' }, { status: 400 })
  }

  // Verificar que el email no esté ya en uso
  const { data: existente } = await supabaseAdmin
    .from('staff').select('id').eq('email', email).single()
  if (existente) return NextResponse.json({ error: 'Email ya registrado' }, { status: 409 })

  const password_hash = await bcrypt.hash(password, 12)

  const { data, error } = await supabaseAdmin
    .from('staff')
    .insert({ nombre, email, password_hash, lugar_id: payload.lugarId })
    .select('id, nombre, email, activo, created_at')
    .single()

  if (error) return NextResponse.json({ error: 'Error al crear camarero' }, { status: 500 })
  return NextResponse.json({ staff: data }, { status: 201 })
}

// PATCH — activar/desactivar camarero
export async function PATCH(request) {
  const payload = verificarToken(extraerTokenDeCookie(request))
  if (!payload || payload.rol !== 'manager') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id, activo } = await request.json()
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

  // Verificar que el staff pertenece al local del manager
  const { data: staffRow } = await supabaseAdmin
    .from('staff').select('id').eq('id', id).eq('lugar_id', payload.lugarId).single()
  if (!staffRow) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  await supabaseAdmin.from('staff').update({ activo }).eq('id', id)
  return NextResponse.json({ ok: true })
}
