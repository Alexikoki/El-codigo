import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { requireAuth } from '../../../../lib/auth'

export async function GET(request) {
    const { response } = requireAuth(request, 'superadmin')
    if (response) return response

    try {
        const { searchParams } = new URL(request.url)
        const desde = searchParams.get('desde')
        const hasta = searchParams.get('hasta')

        let query = supabaseAdmin
            .from('valoraciones')
            .select('gasto, created_at')
            .order('created_at', { ascending: true })
        if (desde) query = query.gte('created_at', desde)
        if (hasta) query = query.lte('created_at', hasta + 'T23:59:59.999Z')

        const { data: records, error } = await query
        if (error) throw error

        const rawData = {}
        records.forEach(r => {
            const date = new Date(r.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
            if (!rawData[date]) {
                rawData[date] = { date, gastoTotal: 0, comisionTotal: 0, afluencia: 0 }
            }
            rawData[date].gastoTotal += r.gasto
            rawData[date].comisionTotal += r.gasto * 0.15
            rawData[date].afluencia += 1
        })

        const chartData = Object.values(rawData)
        const stats = {
            operaciones: records.length,
            volumenEuros: chartData.reduce((acc, curr) => acc + curr.gastoTotal, 0),
            comisionGenerada: chartData.reduce((acc, curr) => acc + curr.comisionTotal, 0)
        }

        return NextResponse.json({ chartData, stats })
    } catch (e) {
        console.error('Error /analytics/superadmin:', e)
        return NextResponse.json({ error: 'Error procesando analytics' }, { status: 500 })
    }
}
