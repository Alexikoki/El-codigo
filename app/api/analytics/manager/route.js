import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { requireAuth } from '../../../../lib/auth'

export async function GET(request) {
    const { payload, response } = requireAuth(request, 'manager')
    if (response) return response
    if (!payload.lugarId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    try {
        const managerLugarId = payload.lugarId
        const { searchParams } = new URL(request.url)
        const desde = searchParams.get('desde')
        const hasta = searchParams.get('hasta')

        let query = supabaseAdmin
            .from('valoraciones')
            .select('gasto, comision_lugar, created_at')
            .eq('lugar_id', managerLugarId)
            .order('created_at', { ascending: true })
        if (desde) query = query.gte('created_at', desde)
        if (hasta) query = query.lte('created_at', hasta + 'T23:59:59.999Z')

        const hoyInicio = new Date()
        hoyInicio.setHours(0, 0, 0, 0)

        const [{ data: records, error }, { data: hoyRecords }] = await Promise.all([
            query,
            supabaseAdmin
                .from('valoraciones')
                .select('gasto, comision_lugar, created_at, confirmado_at, num_personas, clientes(nombre), referidores(nombre)')
                .eq('lugar_id', managerLugarId)
                .gte('created_at', hoyInicio.toISOString())
                .order('created_at', { ascending: false })
        ])

        if (error) throw error

        const rawData = {}
        records.forEach(r => {
            const date = new Date(r.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
            if (!rawData[date]) {
                rawData[date] = { date, gastoTotal: 0, deudaTotal: 0, afluencia: 0 }
            }
            rawData[date].gastoTotal += r.gasto
            rawData[date].deudaTotal += (r.comision_lugar || (r.gasto * 0.20))
            rawData[date].afluencia += 1
        })

        const chartData = Object.values(rawData)
        const stats = {
            operaciones: records.length,
            volumenEuros: chartData.reduce((acc, curr) => acc + curr.gastoTotal, 0),
            deudaAcumulada: chartData.reduce((acc, curr) => acc + curr.deudaTotal, 0)
        }

        const hoy = (hoyRecords || []).map(r => ({
            cliente: r.clientes?.nombre || 'Anónimo',
            referidor: r.referidores?.nombre || '—',
            personas: r.num_personas || 1,
            gasto: r.gasto,
            comision: r.comision_lugar || r.gasto * 0.20,
            hora: new Date(r.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            confirmado: !!r.confirmado_at
        }))

        return NextResponse.json({ chartData, stats, hoy })
    } catch (e) {
        console.error('Error /analytics/manager:', e)
        return NextResponse.json({ error: 'Error procesando analytics' }, { status: 500 })
    }
}
