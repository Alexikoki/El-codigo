import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { verificarToken, extraerTokenDeCookie } from '../../../../lib/jwt'

export async function GET(request) {
    try {
        const payload = verificarToken(extraerTokenDeCookie(request))
        if (!payload || payload.rol !== 'agencia' || !payload.agenciaId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const agenciaId = payload.agenciaId

        // Para la agencia necesitamos coger TODAS las valoraciones hechas por CUALQUIERA de sus promotores
        // Usamos un inner join con referidores filtrando por agencia_id
        const { data: records, error } = await supabaseAdmin
            .from('valoraciones')
            .select('gasto, comision_agencia, created_at, referidores!inner(agencia_id)')
            .eq('referidores.agencia_id', agenciaId)
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

    } catch (globalError) {
        console.error('Crash API /analytics/agencia:', globalError)
        return NextResponse.json({ error: 'Fallo procesando el rendimiento estadístico del Tour.' }, { status: 500 })
    }
}

