import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'

export async function GET(request, { params }) {
  const { id } = params

  const { data: cliente } = await supabaseAdmin
    .from('clientes')
    .select('*, lugares(nombre, descuento)')
    .eq('id', id)
    .single()

  if (!cliente) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  }

  if (cliente.valoracion) {
    return NextResponse.json({ yaValorado: true })
  }

  return NextResponse.json({
    cliente: { nombre: cliente.nombre },
    lugar: { nombre: cliente.lugares.nombre, descuento: cliente.lugares.descuento }
  })
}

export async function POST(request, { params }) {
  const { id } = params
  const { gasto, valoracion } = await request.json()

  if (!gasto || !valoracion || valoracion < 1 || valoracion > 5) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const { data: cliente } = await supabaseAdmin
    .from('clientes')
    .select('valoracion, lugar_id, referidor_id')
    .eq('id', id)
    .single()

  if (!cliente) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (cliente.valoracion) return NextResponse.json({ error: 'Ya valorado' }, { status: 400 })

  await supabaseAdmin
    .from('clientes')
    .update({ gasto, valoracion, valorado_at: new Date().toISOString() })
    .eq('id', id)

  await supabaseAdmin
    .from('valoraciones')
    .insert({
      cliente_id: id,
      lugar_id: cliente.lugar_id,
      referidor_id: cliente.referidor_id,
      gasto,
      valoracion
    })

  return NextResponse.json({ ok: true })
}