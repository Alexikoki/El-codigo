import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { verificarToken, extraerTokenDeCookie } from '../../../../lib/jwt'

export async function GET(request) {
  try {
    const payload = verificarToken(extraerTokenDeCookie(request))
    if (!payload || payload.rol !== 'referidor') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const limite = 20
    const offset = (pagina - 1) * limite

    // Obtenemos las valoraciones del referidor con datos del cliente
    const { data: valoraciones, error, count } = await supabaseAdmin
      .from('valoraciones')
      .select(`
        id,
        gasto,
        estrellas,
        comision_referidor,
        created_at,
        clientes ( nombre, email, num_personas )
      `, { count: 'exact' })
      .eq('referidor_id', payload.referidorId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limite - 1)

    if (error) throw error

    // Totales globales del referidor
    const { data: totales } = await supabaseAdmin
      .from('valoraciones')
      .select('gasto, comision_referidor')
      .eq('referidor_id', payload.referidorId)

    const totalGasto = totales?.reduce((acc, v) => acc + (v.gasto || 0), 0) || 0
    const totalComision = totales?.reduce((acc, v) => acc + (v.comision_referidor || 0), 0) || 0

    return NextResponse.json({
      historial: valoraciones || [],
      totalPaginas: Math.ceil((count || 0) / limite),
      paginaActual: pagina,
      totalConversiones: count || 0,
      totalGasto: parseFloat(totalGasto.toFixed(2)),
      totalComision: parseFloat(totalComision.toFixed(2)),
    })

  } catch (error) {
    console.error('Error en /api/referidor/historial:', error)
    return NextResponse.json({ error: 'Error al cargar historial' }, { status: 500 })
  }
}
