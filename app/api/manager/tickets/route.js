import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { requireAuth } from '../../../../lib/auth'
import logger from '../../../../lib/logger'

export async function GET(request) {
  try {
    const { payload, response } = requireAuth(request, 'manager')
    if (response) return response
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

    // Generar URLs firmadas para las imágenes (válidas 1 hora)
    const tickets = await Promise.all(data.map(async v => {
      let ticketUrl = v.ticket_url
      if (ticketUrl) {
        try {
          // Extraer el path relativo del bucket de la URL pública
          const match = ticketUrl.match(/\/storage\/v1\/object\/(?:public\/)?tickets\/(.+)/)
          if (match) {
            const { data: signed } = await supabaseAdmin.storage
              .from('tickets')
              .createSignedUrl(match[1], 3600)
            if (signed?.signedUrl) ticketUrl = signed.signedUrl
          }
        } catch { /* mantener URL original si falla */ }
      }
      return {
        id: v.id,
        cliente: v.clientes?.nombre || 'Anónimo',
        referidor: v.referidores?.nombre || '—',
        gasto: v.gasto_confirmado,
        ticketUrl,
        fecha: new Date(v.confirmado_at || v.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        hora: new Date(v.confirmado_at || v.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      }
    }))

    return NextResponse.json({ tickets })
  } catch (e) {
    logger.error({ err: e }, 'Error tickets manager:')
    return NextResponse.json({ error: 'Error cargando tickets' }, { status: 500 })
  }
}
