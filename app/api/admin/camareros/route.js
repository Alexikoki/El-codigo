import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { verificarToken, extraerToken } from '../../../../lib/jwt'
import bcrypt from 'bcryptjs'

export async function GET(request) {
  const payload = verificarToken(extraerToken(request))
  if (!payload || payload.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: camareros } = await supabaseAdmin
    .from('camareros')
    .select('*, empresas(nombre)')
    .order('created_at', { ascending: false })

  return NextResponse.json({ camareros: camareros || [] })
}

export async function POST(request) {
  const payload = verificarToken(extraerToken(request))
  if (!payload || payload.rol !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { nombre, email, password, empresa_id } = await request.json()

  if (!nombre || !email || !password || !empresa_id) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const password_hash = await bcrypt.hash(password, 12)

  const { data: camarero, error } = await supabaseAdmin
    .from('camareros')
    .insert({ nombre, email, password_hash, empresa_id })
    .select('*, empresas(nombre)')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Error al crear camarero' }, { status: 500 })
  }

  return NextResponse.json({ camarero }, { status: 201 })
}