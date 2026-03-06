import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { verificarFirmaQR } from '../../../lib/qr'
import { rateLimit, getIP } from '../../../lib/rateLimit'
import { registrarAudit } from '../../../lib/audit'

export async function POST(request) {
  const ip = getIP(request)

  // Rate limiting: max 20 registros por minuto por IP
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

  // Verificar firma del QR
  const tokenValido = verificarFirmaQR(qrToken)
  if (!tokenValido) {
    return NextResponse.json({ error: 'QR inválido' }, { status: 400 })
  }

  // Buscar referidor
  const { data: referidor } = await supabaseAdmin
    .from('referidores')
    .select('*, empresas(*)')
    .eq('qr_token', tokenValido)
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

  await registrarAudit({
    tabla: 'clientes',
    accion: 'registro',
    registroId: cliente.id,
    empresaId: referidor.empresa_id,
    ip
  })

  return NextResponse.json({ ok: true, cliente }, { status: 201 })
}