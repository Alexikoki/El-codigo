import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { verificarToken, extraerTokenDeCookie } from '../../../lib/jwt'

// GET — superadmin: todas | referidor: las suyas
export async function GET(request) {
  const payload = verificarToken(extraerTokenDeCookie(request))
  if (!payload) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  if (payload.rol === 'superadmin') {
    const { data, error } = await supabaseAdmin
      .from('liquidaciones')
      .select('*, referidores(nombre, email)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ liquidaciones: data || [] })
  }

  if (payload.rol === 'referidor') {
    const { data, error } = await supabaseAdmin
      .from('liquidaciones')
      .select('*')
      .eq('referidor_id', payload.referidorId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ liquidaciones: data || [] })
  }

  return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
}

// POST — superadmin crea una liquidación
export async function POST(request) {
  const payload = verificarToken(extraerTokenDeCookie(request))
  if (!payload || payload.rol !== 'superadmin') {
    return NextResponse.json({ error: 'Solo superadmin' }, { status: 403 })
  }

  const { referidor_id, importe, periodo_desde, periodo_hasta, notas } = await request.json()
  if (!referidor_id || !importe || !periodo_desde || !periodo_hasta) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('liquidaciones')
    .insert({ referidor_id, importe, periodo_desde, periodo_hasta, notas: notas || null, estado: 'pendiente' })
    .select('*, referidores(nombre, email)')
    .single()

  if (error) return NextResponse.json({ error: 'Error creando liquidación' }, { status: 500 })
  return NextResponse.json({ liquidacion: data }, { status: 201 })
}

// PATCH — superadmin marca como pagado
export async function PATCH(request) {
  const payload = verificarToken(extraerTokenDeCookie(request))
  if (!payload || payload.rol !== 'superadmin') {
    return NextResponse.json({ error: 'Solo superadmin' }, { status: 403 })
  }

  const { id, estado } = await request.json()
  if (!id || !estado) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })

  const update = { estado }
  if (estado === 'pagado') update.pagado_at = new Date().toISOString()

  const { error } = await supabaseAdmin.from('liquidaciones').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: 'Error actualizando' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
