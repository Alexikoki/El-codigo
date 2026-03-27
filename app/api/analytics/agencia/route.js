import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { requireAuth } from '../../../../lib/auth'

export async function GET(request) {
    const { payload, response } = requireAuth(request, 'agencia')
    if (response) return response
    if (!payload.agenciaId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    try {
        const { data: records, error } = await supabaseAdmin
            .from('valoraciones')
            .select('gasto, comision_agencia, created_at, referidores!inner(agencia_id)')
            .eq('referidores.agencia_id', payload.agenciaId)
            .order('created_at', { ascending: true })

        if (error) throw error

        const rawData = {}
        records.forEach(r => {
            const date = new Date(r.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
            if (!rawData[date]) {
                rawData[date] = { date, gastoTotal: 0, miComision: 0, afluencia: 0 }
            }
            rawData[date].gastoTotal += r.gasto
            rawData[date].miComision += (r.comision_agencia || 0)
            rawData[date].afluencia += 1
        })

        const chartData = Object.values(rawData)
        const stats = {
            operacionesTotales: records.length,
            volumenEurosGlobal: chartData.reduce((acc, curr) => acc + curr.gastoTotal, 0),
            comisionesAgencia: chartData.reduce((acc, curr) => acc + curr.miComision, 0)
        }

        return NextResponse.json({ chartData, stats })
    } catch (e) {
        console.error('Error /analytics/agencia:', e)
        return NextResponse.json({ error: 'Error procesando analytics' }, { status: 500 })
    }
}
