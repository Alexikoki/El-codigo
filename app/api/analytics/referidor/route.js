import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { requireAuth } from '../../../../lib/auth'
import logger from '../../../../lib/logger'

export async function GET(request) {
    const { payload, response } = requireAuth(request, 'referidor')
    if (response) return response

    try {
        const { data: records, error } = await supabaseAdmin
            .from('valoraciones')
            .select('gasto, created_at')
            .eq('referidor_id', payload.referidorId)
            .order('created_at', { ascending: true })

        if (error) throw error

        const rawData = {}
        records.forEach(r => {
            const date = new Date(r.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
            if (!rawData[date]) {
                rawData[date] = { date, gastoMovido: 0, miComision: 0, turistasValidados: 0 }
            }
            rawData[date].gastoMovido += r.gasto
            rawData[date].miComision += r.gasto * 0.15
            rawData[date].turistasValidados += 1
        })

        const chartData = Object.values(rawData)
        const stats = {
            exitosMios: records.length,
            comisionesLiquidadas: chartData.reduce((acc, curr) => acc + curr.miComision, 0)
        }

        return NextResponse.json({ chartData, stats })
    } catch (e) {
        logger.error({ err: e }, 'Error /analytics/referidor:')
        return NextResponse.json({ error: 'Error procesando analytics' }, { status: 500 })
    }
}
