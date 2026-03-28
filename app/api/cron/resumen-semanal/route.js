import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { enviarResumenSemanal } from '../../../../lib/email'
import logger from '../../../../lib/logger'

export async function GET(request) {
    // Vercel Cron: verifica el secret de autorización
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    try {
        const desde = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
        const desdeISO = desde.toISOString()

        // Valoraciones de los últimos 7 días
        const { data: valoraciones } = await supabaseAdmin
            .from('valoraciones')
            .select('gasto, comision_lugar, referidor_id, referidores(nombre)')
            .gte('created_at', desdeISO)

        const vals = valoraciones || []
        const stats = {
            operaciones: vals.length,
            volumen: vals.reduce((s, v) => s + (v.gasto || 0), 0),
            comisiones: vals.reduce((s, v) => s + (v.comision_lugar || v.gasto * 0.20 || 0), 0)
        }

        // Top referidores por comisión
        const mapaRef = {}
        vals.forEach(v => {
            if (!v.referidor_id) return
            if (!mapaRef[v.referidor_id]) {
                mapaRef[v.referidor_id] = { nombre: v.referidores?.nombre || '—', clientes: 0, comision: 0 }
            }
            mapaRef[v.referidor_id].clientes += 1
            mapaRef[v.referidor_id].comision += v.comision_lugar || v.gasto * 0.20 || 0
        })
        const topReferidores = Object.values(mapaRef)
            .sort((a, b) => b.comision - a.comision)
            .slice(0, 5)

        // Liquidaciones pendientes
        const { count: pendientes } = await supabaseAdmin
            .from('liquidaciones')
            .select('id', { count: 'exact', head: true })
            .eq('estado', 'pendiente')

        // Email del superadmin (variable de entorno o hardcoded como fallback)
        const superadminEmail = process.env.SUPERADMIN_EMAIL
        const superadminNombre = process.env.SUPERADMIN_NOMBRE || 'Admin'

        if (!superadminEmail) {
            return NextResponse.json({ error: 'SUPERADMIN_EMAIL no configurado' }, { status: 500 })
        }

        await enviarResumenSemanal({
            email: superadminEmail,
            nombre: superadminNombre,
            stats,
            topReferidores,
            pendientes: pendientes || 0
        })

        return NextResponse.json({ ok: true, stats, topReferidores, pendientes })

    } catch (error) {
        logger.error({ err: error }, 'Cron resumen semanal error')
        return NextResponse.json({ error: 'Error generando resumen' }, { status: 500 })
    }
}
