import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { verificarToken, extraerToken } from '../../../../lib/jwt'

export async function GET(request) {
    try {
        const payload = verificarToken(extraerToken(request))
        if (!payload || payload.rol !== 'referidor') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Obtenemos solo valoraciones de clientes invitados por ESTE referidor
        const { data: records, error } = await supabaseAdmin
            .from('valoraciones')
            .select('gasto, created_at')
            .eq('referidor_id', payload.uid)
            .order('created_at', { ascending: true })

        if (error) throw error

        // Agrupación individual
        const rawData = {}

        records.forEach(r => {
            const date = new Date(r.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
            if (!rawData[date]) {
                rawData[date] = { date, gastoMovido: 0, miComision: 0, turistasValidados: 0 }
            }
            rawData[date].gastoMovido += r.gasto
            rawData[date].miComision += r.gasto * 0.15 // 15% simulación tuya
            rawData[date].turistasValidados += 1
        })

        const chartData = Object.values(rawData)

        const stats = {
            exitosMios: records.length,
            comisionesLiquidadas: chartData.reduce((acc, curr) => acc + curr.miComision, 0)
        }

        return NextResponse.json({ chartData, stats })

    } catch (globalError) {
        console.error('Crash API /analytics/referidor:', globalError)
        return NextResponse.json({ error: 'Fallo leyendo comisiones.' }, { status: 500 })
    }
}
