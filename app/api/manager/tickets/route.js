import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { verificarToken, extraerTokenDeCookie } from '../../../../lib/jwt'

export async function GET(request) {
  try {
    const payload = verificarToken(extraerTokenDeCookie(request))
    if (!payload) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    if (payload.rol !== 'manager') return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    if (!payload.lugarId) return NextResponse.json({ error: 'Manager sin lugar asignado' }, { status: 403 })

    const managerLugarId = payload.lugarId

    const { data, error } = await supabaseAdmin
      .from('valoraciones')
      .select('id, gasto_confirmado, ticket_url, confirmado_at, created_at, clientes(nombre), referidores(nombre)')
      .eq('lugar_id', managerLugarId)
      .not('ticket_url', 'is', null)
      .order('confirmado_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({
      tickets: data.map(v => ({
        id: v.id,
        cliente: v.clientes?.nombre || 'Anónimo',
        referidor: v.referidores?.nombre || '—',
        gasto: v.gasto_confirmado,
        ticketUrl: v.ticket_url,
        fecha: new Date(v.confirmado_at || v.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        hora: new Date(v.confirmado_at || v.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      }))
    })
  } catch (e) {
    console.error('Error tickets manager:', e)
    return NextResponse.json({ error: 'Error cargando tickets' }, { status: 500 })
  }
}
