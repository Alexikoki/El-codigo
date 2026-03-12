import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { verificarToken, extraerTokenDeCookie } from '../../../../lib/jwt'

export async function GET(request) {
    try {
        const payload = verificarToken(extraerTokenDeCookie(request))
        if (!payload || payload.rol !== 'superadmin') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Obtenemos todas las valoraciones confirmadas (Gasto depositado en el local)
        const { data: records, error } = await supabaseAdmin
            .from('valoraciones')
            .select('gasto, created_at')
            .order('created_at', { ascending: true })

        if (error) throw error

        // Agrupamos la afluencia y el gasto/comisión (asumiendo 15% comisión estandar) por día.
        const rawData = {}

        records.forEach(r => {
            const date = new Date(r.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
            if (!rawData[date]) {
                rawData[date] = { date, gastoTotal: 0, comisionTotal: 0, afluencia: 0 }
            }
            rawData[date].gastoTotal += r.gasto
            rawData[date].comisionTotal += r.gasto * 0.15 // 15% simulación de comisión root pura
            rawData[date].afluencia += 1
        })

        const chartData = Object.values(rawData)

        // Calculamos totales estáticos absolutos
        const stats = {
            operaciones: records.length,
            volumenEuros: chartData.reduce((acc, curr) => acc + curr.gastoTotal, 0),
            comisionGenerada: chartData.reduce((acc, curr) => acc + curr.comisionTotal, 0)
        }

        return NextResponse.json({ chartData, stats })

    } catch (globalError) {
        console.error('Crash API /analytics/superadmin:', globalError)
        return NextResponse.json({ error: 'Fallo procesando los motores gráficos.' }, { status: 500 })
    }
}

