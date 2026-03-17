import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { verificarToken, extraerTokenDeCookie } from '../../../lib/jwt'
import bcrypt from 'bcryptjs'

// GET — superadmin lista todas las agencias
export async function GET(request) {
  const payload = verificarToken(extraerTokenDeCookie(request))
  if (!payload || payload.rol !== 'superadmin') {
    return NextResponse.json({ error: 'Solo superadmin' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('agencias')
    .select('id, nombre, email, activo, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Error obteniendo agencias' }, { status: 500 })
  return NextResponse.json({ agencias: data || [] })
}

// POST — superadmin crea una agencia
export async function POST(request) {
  const payload = verificarToken(extraerTokenDeCookie(request))
  if (!payload || payload.rol !== 'superadmin') {
    return NextResponse.json({ error: 'Solo superadmin' }, { status: 403 })
  }

  const { nombre, email, password } = await request.json()
  if (!nombre || !email || !password) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const password_hash = await bcrypt.hash(password, 12)

  const { data, error } = await supabaseAdmin
    .from('agencias')
    .insert({ nombre, email, password_hash, activo: true })
    .select('id, nombre, email, activo, created_at')
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 })
    return NextResponse.json({ error: 'Error creando agencia' }, { status: 500 })
  }

  return NextResponse.json({ agencia: data }, { status: 201 })
}

// PATCH — superadmin activa/desactiva agencia
export async function PATCH(request) {
  const payload = verificarToken(extraerTokenDeCookie(request))
  if (!payload || payload.rol !== 'superadmin') {
    return NextResponse.json({ error: 'Solo superadmin' }, { status: 403 })
  }

  const { id, activo } = await request.json()
  if (!id || activo === undefined) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('agencias').update({ activo }).eq('id', id)
  if (error) return NextResponse.json({ error: 'Error actualizando agencia' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
