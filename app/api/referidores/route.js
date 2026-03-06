import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { verificarToken, extraerToken } from '../../../lib/jwt'
import { generarQRToken, firmarToken } from '../../../lib/qr'
import { registrarAudit } from '../../../lib/audit'
import { getIP } from '../../../lib/rateLimit'

export async function GET(request) {
  const payload = verificarToken(extraerToken(request))
  if (!payload || payload.rol !== 'empresa') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: referidores } = await supabaseAdmin
    .from('referidores')
    .select('*')
    .eq('empresa_id', payload.empresaId)
    .order('created_at', { ascending: false })

  return NextResponse.json({ referidores })
}

export async function POST(request) {
  const ip = getIP(request)
  const payload = verificarToken(extraerToken(request))
  if (!payload || payload.rol !== 'empresa') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { nombre } = await request.json()
  if (!nombre) {
    return NextResponse.json({ error: 'Falta el nombre' }, { status: 400 })
  }

  // Generar QR token firmado
  const tokenBase = generarQRToken()
  const qrToken = firmarToken(tokenBase)

  const { data: referidor, error } = await supabaseAdmin
    .from('referidores')
    .insert({
      empresa_id: payload.empresaId,
      nombre,
      qr_token: tokenBase
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Error al crear referidor' }, { status: 500 })
  }

  await registrarAudit({
    tabla: 'referidores',
    accion: 'crear',
    registroId: referidor.id,
    empresaId: payload.empresaId,
    ip
  })

  // URL del QR
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const qrUrl = `${baseUrl}/r/${qrToken}`

  return NextResponse.json({ referidor, qrUrl }, { status: 201 })
}

export async function DELETE(request) {
  const ip = getIP(request)
  const payload = verificarToken(extraerToken(request))
  if (!payload || payload.rol !== 'empresa') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await request.json()

  const { error } = await supabaseAdmin
    .from('referidores')
    .update({ activo: false })
    .eq('id', id)
    .eq('empresa_id', payload.empresaId)

  if (error) {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }

  await registrarAudit({
    tabla: 'referidores',
    accion: 'desactivar',
    registroId: id,
    empresaId: payload.empresaId,
    ip
  })

  return NextResponse.json({ ok: true })
}