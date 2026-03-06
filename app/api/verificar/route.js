import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { verificarToken, extraerToken } from '../../../lib/jwt'
import { registrarAudit } from '../../../lib/audit'
import { rateLimit, getIP } from '../../../lib/rateLimit'

export async function POST(request) {
  const ip = getIP(request)

  const { bloqueado } = rateLimit(ip, 30, 60000)
  if (bloqueado) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera 1 minuto.' },
      { status: 429 }
    )
  }

  const payload = verificarToken(extraerToken(request))
  if (!payload || payload.rol !== 'camarero') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { clienteId } = await request.json()
  if (!clienteId) {
    return NextResponse.json({ error: 'Falta el ID del cliente' }, { status: 400 })
  }

  // Buscar cliente
  const { data: cliente } = await supabaseAdmin
    .from('clientes')
    .select('*')
    .eq('id', clienteId)
    .eq('empresa_id', payload.empresaId)
    .single()

  if (!cliente) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  if (cliente.verificado) {
    return NextResponse.json({ error: 'Cliente ya verificado' }, { status: 400 })
  }

  // Verificar cliente
  const { error } = await supabaseAdmin
    .from('clientes')
    .update({
      verificado: true,
      verificado_at: new Date().toISOString(),
      verificado_por: payload.camareroId
    })
    .eq('id', clienteId)

  if (error) {
    return NextResponse.json({ error: 'Error al verificar' }, { status: 500 })
  }

  await registrarAudit({
    tabla: 'clientes',
    accion: 'verificacion',
    registroId: clienteId,
    empresaId: payload.empresaId,
    ip
  })

  return NextResponse.json({ ok: true, cliente: { ...cliente, verificado: true } })
}