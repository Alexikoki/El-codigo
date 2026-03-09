import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { verificarToken, extraerToken } from '../../../lib/jwt'

export async function GET(request) {
  const { data: lugares } = await supabaseAdmin
    .from('lugares')
    .select('*')
    .eq('activo', true)
    .order('nombre')

  return NextResponse.json({ lugares: lugares || [] })
}

export async function POST(request) {
  const payload = verificarToken(extraerToken(request))
  if (!payload || payload.rol !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { nombre, tipo, descripcion, direccion, descuento } = await request.json()
  if (!nombre || !tipo) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('lugares')
    .insert({ nombre, tipo, descripcion, direccion, descuento: descuento || 10 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al crear' }, { status: 500 })
  return NextResponse.json({ lugar: data }, { status: 201 })
}

export async function PATCH(request) {
  const payload = verificarToken(extraerToken(request))
  if (!payload || payload.rol !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id, ...campos } = await request.json()
  await supabaseAdmin.from('lugares').update(campos).eq('id', id)
  return NextResponse.json({ ok: true })
}