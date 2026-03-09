import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { verificarToken, extraerToken } from '../../../lib/jwt'

export async function POST(request) {
  const payload = verificarToken(extraerToken(request))
  if (!payload || payload.rol !== 'staff') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { clienteId } = await request.json()

  const { data: cliente } = await supabaseAdmin
    .from('clientes')
    .select('*, lugares(nombre)')
    .eq('id', clienteId)
    .eq('lugar_id', payload.lugarId)
    .single()

  if (!cliente) {
    return NextResponse.json({ error: 'QR no válido para este local' }, { status: 404 })
  }

  if (!cliente.confirmado) {
    return NextResponse.json({ error: 'Cliente no ha confirmado su email' }, { status: 400 })
  }

  if (new Date() > new Date(cliente.qr_expira_at)) {
    return NextResponse.json({ error: 'QR expirado' }, { status: 400 })
  }

  if (cliente.verificado) {
    return NextResponse.json({ error: 'QR ya utilizado' }, { status: 400 })
  }

  await supabaseAdmin
    .from('clientes')
    .update({ verificado: true, verificado_at: new Date().toISOString() })
    .eq('id', clienteId)

  return NextResponse.json({
    ok: true,
    cliente: {
      nombre: cliente.nombre,
      numPersonas: cliente.num_personas,
      email: cliente.email
    }
  })
}