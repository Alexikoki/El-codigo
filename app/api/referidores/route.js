import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { verificarToken, extraerTokenDeCookie } from '../../../lib/jwt'
import { generarQRToken } from '../../../lib/qr'
import bcrypt from 'bcryptjs'

export async function GET(request) {
  const payload = verificarToken(extraerTokenDeCookie(request))
  if (!payload || payload.rol !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data } = await supabaseAdmin
    .from('referidores')
    .select('id, nombre, email, qr_token, activo, created_at')
    .order('created_at', { ascending: false })

  return NextResponse.json({ referidores: data || [] })
}

export async function POST(request) {
  const payload = verificarToken(extraerTokenDeCookie(request))
  if (!payload || payload.rol !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { nombre, email, password } = await request.json()
  if (!nombre || !email || !password) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const password_hash = await bcrypt.hash(password, 12)
  const qr_token = generarQRToken()

  const { data, error } = await supabaseAdmin
    .from('referidores')
    .insert({ nombre, email, password_hash, qr_token })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al crear' }, { status: 500 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  return NextResponse.json({
    referidor: data,
    qrUrl: `${appUrl}/r/${qr_token}`
  }, { status: 201 })
}

export async function PATCH(request) {
  const payload = verificarToken(extraerTokenDeCookie(request))
  if (!payload || payload.rol !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id, activo } = await request.json()
  await supabaseAdmin.from('referidores').update({ activo }).eq('id', id)
  return NextResponse.json({ ok: true })
}
