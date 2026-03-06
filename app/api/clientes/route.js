import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { rateLimit, getIP } from '../../../lib/rateLimit'
import { registrarAudit } from '../../../lib/audit'
import { enviarQRPersonal } from '../../../lib/email'

export async function POST(request) {
  const ip = getIP(request)

  const { bloqueado } = rateLimit(ip, 20, 60000)
  if (bloqueado) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera 1 minuto.' },
      { status: 429 }
    )
  }

  const { nombre, email, numPersonas, qrToken } = await request.json()

  if (!nombre || !email || !qrToken) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  // Buscar referidor con empresa y descuento
  const { data: referidor } = await supabaseAdmin
    .from('referidores')
    .select('*, empresas(id, nombre, descuento)')
    .eq('qr_token', qrToken)
    .eq('activo', true)
    .single()

  if (!referidor) {
    return NextResponse.json({ error: 'QR no encontrado' }, { status: 404 })
  }

  // Registrar cliente
  const { data: cliente, error } = await supabaseAdmin
    .from('clientes')
    .insert({
      referidor_id: referidor.id,
      empresa_id: referidor.empresa_id,
      nombre,
      email,
      num_personas: numPersonas || 1
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Error al registrar' }, { status: 500 })
  }

  // Guardar qr_personal con el ID del cliente
  await supabaseAdmin
    .from('clientes')
    .update({ qr_personal: cliente.id })
    .eq('id', cliente.id)

  // Enviar email con QR personal
  try {
    await enviarQRPersonal({
      nombre,
      email,
      clienteId: cliente.id,
      empresaNombre: referidor.empresas.nombre,
      descuento: referidor.empresas.descuento
    })
  } catch (e) {
    console.error('Error enviando email:', e)
  }

  await registrarAudit({
    tabla: 'clientes',
    accion: 'registro',
    registroId: cliente.id,
    empresaId: referidor.empresa_id,
    ip
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}