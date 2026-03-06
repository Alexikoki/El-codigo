import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { verificarToken, extraerToken } from '../../../lib/jwt'
import { generarQRToken, generarQRImage } from '../../../lib/qr'
import { registrarAudit } from '../../../lib/audit'

export async function GET(request) {
  const payload = verificarToken(extraerToken(request))
  if (!payload || payload.rol !== 'empresa') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: referidores } = await supabaseAdmin
    .from('referidores')
    .select('*')
    .eq('empresa_id', payload.empresaId)
    .eq('activo', true)
    .order('created_at', { ascending: false })

  return NextResponse.json({ referidores: referidores || [] })
}

export async function POST(request) {
  const payload = verificarToken(extraerToken(request))
  if (!payload || payload.rol !== 'empresa') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { nombre } = await request.json()
  if (!nombre) {
    return NextResponse.json({ error: 'Falta el nombre' }, { status: 400 })
  }

  const qrToken = generarQRToken()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const qrUrl = `${appUrl}/r/${qrToken}`
  const qrImage = await generarQRImage(qrUrl)

  const { data: referidor, error } = await supabaseAdmin
    .from('referidores')
    .insert({
      empresa_id: payload.empresaId,
      nombre,
      qr_token: qrToken,
      activo: true
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
    ip: request.headers.get('x-forwarded-for') || 'unknown'
  })

  return NextResponse.json({ referidor, qrUrl, qrImage }, { status: 201 })
}

export async function DELETE(request) {
  const payload = verificarToken(extraerToken(request))
  if (!payload || payload.rol !== 'empresa') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await request.json()

  await supabaseAdmin
    .from('referidores')
    .update({ activo: false })
    .eq('id', id)
    .eq('empresa_id', payload.empresaId)

  return NextResponse.json({ ok: true })
}