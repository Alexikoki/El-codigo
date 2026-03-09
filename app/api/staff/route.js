import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { verificarToken, extraerToken } from '../../../lib/jwt'
import bcrypt from 'bcryptjs'

export async function GET(request) {
  const payload = verificarToken(extraerToken(request))
  if (!payload || payload.rol !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data } = await supabaseAdmin
    .from('staff')
    .select('*, lugares(nombre)')
    .order('created_at', { ascending: false })

  return NextResponse.json({ staff: data || [] })
}

export async function POST(request) {
  const payload = verificarToken(extraerToken(request))
  if (!payload || payload.rol !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { nombre, email, password, lugar_id } = await request.json()
  if (!nombre || !email || !password || !lugar_id) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const password_hash = await bcrypt.hash(password, 12)

  const { data, error } = await supabaseAdmin
    .from('staff')
    .insert({ nombre, email, password_hash, lugar_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al crear' }, { status: 500 })
  return NextResponse.json({ staff: data }, { status: 201 })
}