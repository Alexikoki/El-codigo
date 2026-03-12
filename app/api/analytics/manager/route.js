import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { verificarToken, extraerTokenDeCookie } from '../../../../lib/jwt'

export async function GET(request) {
    try {
        const payload = verificarToken(extraerTokenDeCookie(request))
        if (!payload || payload.rol !== 'manager' || !payload.lugarId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const managerLugarId = payload.lugarId

        // Obtenemos todas las valoraciones confirmadas pero limitadas al local del Manager
        const { data: records, error } = await supabaseAdmin
            .from('valoraciones')
            .select('gasto, comision_lugar, created_at')
            .eq('lugar_id', managerLugarId)
            .order('created_at', { ascending: true })

        if (error) throw error

        // Agrupamos la afluencia y el gasto/comisión por día.
        const rawData = {}

        records.forEach(r => {
            const date = new Date(r.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
            if (!rawData[date]) {
                rawData[date] = { date, gastoTotal: 0, deudaTotal: 0, afluencia: 0 }
            }
            rawData[date].gastoTotal += r.gasto
            // Sumamos la comision depositada pre-calculada o si no existe (v1), un 20% default.
            rawData[date].deudaTotal += (r.comision_lugar || (r.gasto * 0.20))
            rawData[date].afluencia += 1
        })

        const chartData = Object.values(rawData)

        // Calculamos totales estáticos absolutos
        const stats = {
            operaciones: records.length,
            volumenEuros: chartData.reduce((acc, curr) => acc + curr.gastoTotal, 0),
            deudaAcumulada: chartData.reduce((acc, curr) => acc + curr.deudaTotal, 0)
        }

        return NextResponse.json({ chartData, stats })

    } catch (globalError) {
        console.error('Crash API /analytics/manager:', globalError)
        return NextResponse.json({ error: 'Fallo procesando los motores gráficos del local.' }, { status: 500 })
    }
}

