import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase'
import { requireAuth } from '../../../../../lib/auth'
import logger from '../../../../../lib/logger'

export async function GET(request) {
  const { payload, response } = requireAuth(request, 'agencia')
  if (response) return response
  if (!payload.agenciaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {

    const agenciaId = payload.agenciaId

    // Todos los promotores de la agencia
    const { data: promotores } = await supabaseAdmin
      .from('referidores')
      .select('id, nombre, email, porcentaje_split, activo')
      .eq('agencia_id', agenciaId)

    if (!promotores || promotores.length === 0) {
      return NextResponse.json({ promotores: [] })
    }

    // Valoraciones de todos esos promotores
    const promotorIds = promotores.map(p => p.id)
    const { data: valoraciones, error } = await supabaseAdmin
      .from('valoraciones')
      .select('referidor_id, gasto, comision_agencia, created_at')
      .in('referidor_id', promotorIds)

    if (error) throw error

    // Agrupar por promotor
    const statsMap = {}
    promotores.forEach(p => {
      statsMap[p.id] = {
        id: p.id,
        nombre: p.nombre,
        email: p.email,
        porcentaje_split: p.porcentaje_split,
        activo: p.activo,
        operaciones: 0,
        volumen: 0,
        comisionAgencia: 0,
        ultimaActividad: null,
      }
    })

    ;(valoraciones || []).forEach(v => {
      const s = statsMap[v.referidor_id]
      if (!s) return
      s.operaciones += 1
      s.volumen += v.gasto || 0
      s.comisionAgencia += v.comision_agencia || 0
      if (!s.ultimaActividad || v.created_at > s.ultimaActividad) {
        s.ultimaActividad = v.created_at
      }
    })

    const resultado = Object.values(statsMap).map(s => ({
      ...s,
      volumen: parseFloat(s.volumen.toFixed(2)),
      comisionAgencia: parseFloat(s.comisionAgencia.toFixed(2)),
    }))

    // Ordenar por volumen desc
    resultado.sort((a, b) => b.volumen - a.volumen)

    return NextResponse.json({ promotores: resultado })
  } catch (e) {
    logger.error({ err: e }, 'Error /analytics/agencia/promotores:')
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
