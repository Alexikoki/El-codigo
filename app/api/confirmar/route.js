import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { enviarQRPersonal } from '../../../lib/email'

export async function POST(request) {
  const { clienteId, codigo } = await request.json()

  if (!clienteId || !codigo) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const { data: cliente } = await supabaseAdmin
    .from('clientes')
    .select('*, lugares(nombre, descuento)')
    .eq('id', clienteId)
    .single()

  if (!cliente) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  if (cliente.confirmado) {
    return NextResponse.json({ error: 'Ya confirmado' }, { status: 400 })
  }

  if (new Date() > new Date(cliente.codigo_expira_at)) {
    return NextResponse.json({ error: 'Código expirado' }, { status: 400 })
  }

  if (cliente.codigo_confirmacion !== codigo) {
    return NextResponse.json({ error: 'Código incorrecto' }, { status: 400 })
  }

  const qrExpira = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

  await supabaseAdmin
    .from('clientes')
    .update({
      confirmado: true,
      qr_personal: cliente.id,
      qr_expira_at: qrExpira
    })
    .eq('id', clienteId)

  try {
    await enviarQRPersonal({
      nombre: cliente.nombre,
      email: cliente.email,
      clienteId: cliente.id,
      lugarNombre: cliente.lugares.nombre,
      descuento: cliente.lugares.descuento
    })
  } catch (e) {
    console.error('Error enviando QR:', e)
  }

  return NextResponse.json({ ok: true })
}
