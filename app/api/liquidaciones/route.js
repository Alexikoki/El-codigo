import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireAuth } from '../../../lib/auth'
import { checkRateLimit } from '../../../lib/rateLimitMiddleware'
import { validateBody, liquidacionSchema, liquidacionPatchSchema } from '../../../lib/validation'
import { enviarEmailLiquidacionCreada, enviarEmailLiquidacionPagada } from '../../../lib/email'
import logger from '../../../lib/logger'

// GET — superadmin: todas | agencia: las de sus promotores + las propias | referidor: las suyas
export async function GET(request) {
  const { payload, response } = requireAuth(request)
  if (response) return response

  try {
    if (payload.rol === 'superadmin') {
      const { data, error } = await supabaseAdmin
        .from('liquidaciones')
        .select('*, referidores(nombre, email), agencias(nombre)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return NextResponse.json({ liquidaciones: data || [] })
    }

    if (payload.rol === 'agencia') {
      const { data: promotores } = await supabaseAdmin
        .from('referidores')
        .select('id')
        .eq('agencia_id', payload.agenciaId)
      const ids = (promotores || []).map(p => p.id)

      // Usar dos queries separadas y combinar en vez de .or() con interpolación
      const [{ data: liqRef }, { data: liqAge }] = await Promise.all([
        ids.length > 0
          ? supabaseAdmin.from('liquidaciones')
              .select('*, referidores(nombre, email), agencias(nombre)')
              .in('referidor_id', ids)
              .order('created_at', { ascending: false })
          : { data: [] },
        supabaseAdmin.from('liquidaciones')
          .select('*, referidores(nombre, email), agencias(nombre)')
          .eq('agencia_id', payload.agenciaId)
          .order('created_at', { ascending: false })
      ])

      // Combinar y deduplicar por id
      const seen = new Set()
      const liquidaciones = [...(liqRef || []), ...(liqAge || [])].filter(l => {
        if (seen.has(l.id)) return false
        seen.add(l.id)
        return true
      }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      return NextResponse.json({ liquidaciones })
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
  } catch (e) {
    logger.error({ err: e }, 'Error GET liquidaciones')
    return NextResponse.json({ error: 'Error cargando liquidaciones' }, { status: 500 })
  }
}

// POST — superadmin o agencia crean una liquidación
export async function POST(request) {
  const rl = await checkRateLimit(request, { limite: 10, ventanaMs: 60000 })
  if (rl) return rl
  const { payload, response } = requireAuth(request, ['superadmin', 'agencia'])
  if (response) return response

  try {
    const body = await request.json()
    const { data: validated, response: valErr } = validateBody(body, liquidacionSchema)
    if (valErr) return valErr
    const { referidor_id, importe, periodo_desde, periodo_hasta, notas } = validated

    // Si es agencia, verificar que el referidor pertenece a ella
    if (payload.rol === 'agencia') {
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
      .select('*, referidores(nombre, email), agencias(nombre, email)')
      .single()

    if (error) return NextResponse.json({ error: 'Error creando liquidación' }, { status: 500 })

    try {
      if (data.referidores?.email && data.referidores?.nombre) {
        await enviarEmailLiquidacionCreada({ nombre: data.referidores.nombre, email: data.referidores.email, ...data })
      } else if (data.agencias?.email && data.agencias?.nombre) {
        await enviarEmailLiquidacionCreada({ nombre: data.agencias.nombre, email: data.agencias.email, ...data })
      }
    } catch (e) { logger.error({ err: e }, 'Email liquidación creada') }

    return NextResponse.json({ liquidacion: data }, { status: 201 })
  } catch (e) {
    logger.error({ err: e }, 'Error POST liquidaciones')
    return NextResponse.json({ error: 'Error creando liquidación' }, { status: 500 })
  }
}

// PATCH — superadmin o agencia marcan como pagado
export async function PATCH(request) {
  const rl = await checkRateLimit(request, { limite: 20, ventanaMs: 60000 })
  if (rl) return rl
  const { payload, response } = requireAuth(request, ['superadmin', 'agencia'])
  if (response) return response

  try {
    const body = await request.json()
    const { data: validated, response: valErr } = validateBody(body, liquidacionPatchSchema)
    if (valErr) return valErr
    const { id, estado } = validated

    if (payload.rol === 'agencia') {
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

    if (estado === 'pagado') {
      try {
        const { data: liq } = await supabaseAdmin
          .from('liquidaciones')
          .select('importe, periodo_desde, periodo_hasta, referidores(nombre, email), agencias(nombre, email)')
          .eq('id', id).single()
        if (liq?.referidores?.email) {
          await enviarEmailLiquidacionPagada({ nombre: liq.referidores.nombre, email: liq.referidores.email, ...liq })
        } else if (liq?.agencias?.email) {
          await enviarEmailLiquidacionPagada({ nombre: liq.agencias.nombre, email: liq.agencias.email, ...liq })
        }
      } catch (e) { logger.error({ err: e }, 'Email liquidación pagada') }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    logger.error({ err: e }, 'Error PATCH liquidaciones')
    return NextResponse.json({ error: 'Error actualizando liquidación' }, { status: 500 })
  }
}
