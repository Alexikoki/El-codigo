import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { rateLimit, getIP } from '../../../lib/rateLimit'
import { generarCodigoConfirmacion } from '../../../lib/qr'
import { enviarCodigoConfirmacion } from '../../../lib/email'

export async function POST(request) {
  const ip = getIP(request)
  const { bloqueado } = rateLimit(ip, 20, 60000)
  if (bloqueado) {
    return NextResponse.json({ error: 'Demasiados intentos' }, { status: 429 })
  }

  const { nombre, email, numPersonas, qrToken, lugarId } = await request.json()

  if (!nombre || !email || !qrToken || !lugarId) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const { data: referidor } = await supabaseAdmin
    .from('referidores')
    .select('id')
    .eq('qr_token', qrToken)
    .eq('activo', true)
    .single()

  if (!referidor) {
    return NextResponse.json({ error: 'QR no válido' }, { status: 404 })
  }

  const codigo = generarCodigoConfirmacion()
  const expira = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  const { data: cliente, error } = await supabaseAdmin
    .from('clientes')
    .insert({
      referidor_id: referidor.id,
      lugar_id: lugarId,
      nombre,
      email,
      num_personas: numPersonas || 1,
      codigo_confirmacion: codigo,
      codigo_expira_at: expira
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Error al registrar' }, { status: 500 })
  }

  try {
    await enviarCodigoConfirmacion({ nombre, email, codigo })
  } catch (e) {
    console.error('Error enviando email:', e)
  }

  return NextResponse.json({ ok: true, clienteId: cliente.id }, { status: 201 })
}