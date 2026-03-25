import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { verificarToken, extraerTokenDeCookie } from '../../../../lib/jwt'

export async function GET(request) {
  try {
    const payload = verificarToken(extraerTokenDeCookie(request))
    if (!payload || payload.rol !== 'superadmin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')

    let query = supabaseAdmin
      .from('valoraciones')
      .select('discrepancia_pct, gasto_confirmado, gasto_cliente, confirmado_at, lugar_id, lugares(nombre)')
      .not('discrepancia_pct', 'is', null)
      .gt('discrepancia_pct', 0)
      .order('confirmado_at', { ascending: false })

    if (desde) query = query.gte('confirmado_at', desde)
    if (hasta) query = query.lte('confirmado_at', hasta + 'T23:59:59.999Z')

    const { data: rows, error } = await query
    if (error) throw error

    // Resumen global
    const resumen = { total: 0, amarillas: 0, naranjas: 0, rojas: 0, diferencia_total: 0 }

    // Agrupado por mes
    const porMes = {}

    // Agrupado por local
    const porLocal = {}

    for (const r of (rows || [])) {
      const disc = parseFloat(r.discrepancia_pct)
      const difEur = Math.abs((r.gasto_cliente || 0) - (r.gasto_confirmado || 0))
      const mes = r.confirmado_at ? r.confirmado_at.slice(0, 7) : 'desconocido' // YYYY-MM
      const lugarId = r.lugar_id
      const lugarNombre = r.lugares?.nombre || lugarId

      // Clasificar
      const nivel = disc >= 15 ? 'roja' : disc >= 5 ? 'naranja' : disc >= 1 ? 'amarilla' : null
      if (!nivel) continue

      // Resumen global
      resumen.total++
      resumen[`${nivel}s`]++
      resumen.diferencia_total += difEur

      // Por mes
      if (!porMes[mes]) porMes[mes] = { mes, total: 0, amarillas: 0, naranjas: 0, rojas: 0, diferencia_total: 0 }
      porMes[mes].total++
      porMes[mes][`${nivel}s`]++
      porMes[mes].diferencia_total += difEur

      // Por local
      if (!porLocal[lugarId]) porLocal[lugarId] = { lugarId, lugarNombre, total: 0, amarillas: 0, naranjas: 0, rojas: 0, diferencia_total: 0 }
      porLocal[lugarId].total++
      porLocal[lugarId][`${nivel}s`]++
      porLocal[lugarId].diferencia_total += difEur
    }

    return NextResponse.json({
      resumen,
      porMes: Object.values(porMes).sort((a, b) => b.mes.localeCompare(a.mes)),
      porLocal: Object.values(porLocal).sort((a, b) => b.total - a.total)
    })
  } catch (e) {
    console.error('Error GET discrepancias:', e)
    return NextResponse.json({ error: 'Error cargando discrepancias' }, { status: 500 })
  }
}
