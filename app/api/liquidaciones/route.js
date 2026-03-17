import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { verificarToken, extraerTokenDeCookie } from '../../../lib/jwt'

// GET — superadmin: todas | agencia: las de sus promotores | referidor: las suyas
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

  if (payload.rol === 'agencia') {
    // Obtener IDs de los promotores de esta agencia
    const { data: promotores } = await supabaseAdmin
      .from('referidores')
      .select('id, nombre')
      .eq('agencia_id', payload.agenciaId)
    const ids = (promotores || []).map(p => p.id)
    if (ids.length === 0) return NextResponse.json({ liquidaciones: [] })

    const { data, error } = await supabaseAdmin
      .from('liquidaciones')
      .select('*, referidores(nombre, email)')
      .in('referidor_id', ids)
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

// POST — superadmin o agencia crean una liquidación
export async function POST(request) {
  const payload = verificarToken(extraerTokenDeCookie(request))
  if (!payload) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const esAdmin = payload.rol === 'superadmin'
  const esAgencia = payload.rol === 'agencia'
  if (!esAdmin && !esAgencia) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

  const { referidor_id, importe, periodo_desde, periodo_hasta, notas } = await request.json()
  if (!referidor_id || !importe || !periodo_desde || !periodo_hasta) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  // Si es agencia, verificar que el referidor pertenece a ella
  if (esAgencia) {
    const { data: ref } = await supabaseAdmin
      .from('referidores')
      .select('agencia_id')
      .eq('id', referidor_id)
      .single()
    if (!ref || ref.agencia_id !== payload.agenciaId) {
      return NextResponse.json({ error: 'Este promotor no pertenece a tu agencia' }, { status: 403 })
    }
  }

  const { data, error } = await supabaseAdmin
    .from('liquidaciones')
    .insert({ referidor_id, importe, periodo_desde, periodo_hasta, notas: notas || null, estado: 'pendiente' })
    .select('*, referidores(nombre, email)')
    .single()

  if (error) return NextResponse.json({ error: 'Error creando liquidación' }, { status: 500 })
  return NextResponse.json({ liquidacion: data }, { status: 201 })
}

// PATCH — superadmin o agencia marcan como pagado
export async function PATCH(request) {
  const payload = verificarToken(extraerTokenDeCookie(request))
  if (!payload) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const esAdmin = payload.rol === 'superadmin'
  const esAgencia = payload.rol === 'agencia'
  if (!esAdmin && !esAgencia) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

  const { id, estado } = await request.json()
  if (!id || !estado) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })

  // Si es agencia, verificar que la liquidación es de uno de sus promotores
  if (esAgencia) {
    const { data: liq } = await supabaseAdmin
      .from('liquidaciones')
      .select('referidor_id, referidores(agencia_id)')
      .eq('id', id)
      .single()
    if (!liq || liq.referidores?.agencia_id !== payload.agenciaId) {
      return NextResponse.json({ error: 'No tienes permiso sobre esta liquidación' }, { status: 403 })
    }
  }

  const update = { estado }
  if (estado === 'pagado') update.pagado_at = new Date().toISOString()

  const { error } = await supabaseAdmin.from('liquidaciones').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: 'Error actualizando' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
