import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { verificarFirmaQR } from '../../../../lib/qr'
import { rateLimit, getIP } from '../../../../lib/rateLimit'

export async function GET(request, { params }) {
  const { id } = params

  // Verificar firma del QR personal
  const clienteId = verificarFirmaQR(id)
  if (!clienteId) {
    return NextResponse.json({ error: 'QR inválido' }, { status: 400 })
  }

  const { data: cliente } = await supabaseAdmin
    .from('clientes')
    .select('*, empresas(nombre, descuento)')
    .eq('id', clienteId)
    .single()

  if (!cliente) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  if (cliente.valoracion) {
    return NextResponse.json({ yaValorado: true })
  }

  return NextResponse.json({
    cliente: { id: cliente.id, nombre: cliente.nombre },
    empresa: { nombre: cliente.empresas.nombre, descuento: cliente.empresas.descuento }
  })
}

export async function POST(request, { params }) {
  const { id } = params
  const ip = getIP(request)

  const { bloqueado } = rateLimit(ip, 5, 60000)
  if (bloqueado) {
    return NextResponse.json(
      { error: 'Demasiados intentos.' },
      { status: 429 }
    )
  }

  // Verificar firma del QR personal
  const clienteId = verificarFirmaQR(id)
  if (!clienteId) {
    return NextResponse.json({ error: 'QR inválido' }, { status: 400 })
  }

  const { gasto, valoracion } = await request.json()

  if (!gasto || !valoracion) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  if (valoracion < 1 || valoracion > 5) {
    return NextResponse.json({ error: 'Valoración inválida' }, { status: 400 })
  }

  // Verificar que no haya valorado ya
  const { data: cliente } = await supabaseAdmin
    .from('clientes')
    .select('valoracion, empresa_id')
    .eq('id', clienteId)
    .single()

  if (!cliente) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  if (cliente.valoracion) {
    return NextResponse.json({ error: 'Ya has valorado' }, { status: 400 })
  }

  // Guardar valoración
  await supabaseAdmin
    .from('clientes')
    .update({
      gasto,
      valoracion,
      valorado_at: new Date().toISOString(),
      verificado: true,
      verificado_at: new Date().toISOString()
    })
    .eq('id', clienteId)

  await supabaseAdmin
    .from('valoraciones')
    .insert({
      cliente_id: clienteId,
      empresa_id: cliente.empresa_id,
      gasto,
      valoracion
    })

  return NextResponse.json({ ok: true })
}