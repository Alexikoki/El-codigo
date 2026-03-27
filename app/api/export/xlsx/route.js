import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { supabaseAdmin } from '../../../../lib/supabase'
import { requireAuth } from '../../../../lib/auth'

export async function GET(request) {
  try {
    const { payload, response } = requireAuth(request, 'superadmin')
    if (response) return response

    // Traemos valoraciones con todos los datos relevantes
    const { data: valoraciones, error } = await supabaseAdmin
      .from('valoraciones')
      .select('created_at, gasto, num_personas, referidor_id, referidores(nombre, email), lugares(nombre)')
      .order('created_at', { ascending: false })

    if (error) throw error

    const { data: referidores } = await supabaseAdmin
      .from('referidores')
      .select('id, nombre, email, activo, created_at')
      .order('nombre')

    const { data: lugares } = await supabaseAdmin
      .from('lugares')
      .select('nombre, tipo, descuento, activo')
      .order('nombre')

    const { data: liquidaciones } = await supabaseAdmin
      .from('liquidaciones')
      .select('created_at, importe, estado, periodo_desde, periodo_hasta, notas, pagado_at, referidores(nombre, email)')
      .order('created_at', { ascending: false })

    // --- HOJA 1: Operaciones detalladas ---
    const filaOps = (valoraciones || []).map(v => ({
      'Fecha': new Date(v.created_at).toLocaleString('es-ES'),
      'Local': v.lugares?.nombre || '—',
      'Promotor / RRPP': v.referidores?.nombre || '—',
      'Email Promotor': v.referidores?.email || '—',
      'Personas': v.num_personas || 1,
      'Gasto (€)': parseFloat(v.gasto?.toFixed(2) || 0),
      'Comisión Plataforma (€)': parseFloat((v.gasto * 0.15).toFixed(2)),
    }))

    // --- HOJA 2: Resumen por promotor ---
    const porPromotor = {}
    ;(valoraciones || []).forEach(v => {
      const key = v.referidor_id
      if (!porPromotor[key]) {
        porPromotor[key] = {
          'Promotor': v.referidores?.nombre || '—',
          'Email': v.referidores?.email || '—',
          'Operaciones': 0,
          'Personas Traídas': 0,
          'Volumen Total (€)': 0,
          'Comisión Plataforma (€)': 0,
        }
      }
      porPromotor[key]['Operaciones'] += 1
      porPromotor[key]['Personas Traídas'] += v.num_personas || 1
      porPromotor[key]['Volumen Total (€)'] += v.gasto || 0
      porPromotor[key]['Comisión Plataforma (€)'] += v.gasto * 0.15
    })
    const filaPromotor = Object.values(porPromotor).map(r => ({
      ...r,
      'Volumen Total (€)': parseFloat(r['Volumen Total (€)'].toFixed(2)),
      'Comisión Plataforma (€)': parseFloat(r['Comisión Plataforma (€)'].toFixed(2)),
    }))

    // --- HOJA 3: Resumen por local ---
    const porLocal = {}
    ;(valoraciones || []).forEach(v => {
      const key = v.lugares?.nombre || '—'
      if (!porLocal[key]) {
        porLocal[key] = { 'Local': key, 'Operaciones': 0, 'Personas': 0, 'Volumen Total (€)': 0, 'Comisión (€)': 0 }
      }
      porLocal[key]['Operaciones'] += 1
      porLocal[key]['Personas'] += v.num_personas || 1
      porLocal[key]['Volumen Total (€)'] += v.gasto || 0
      porLocal[key]['Comisión (€)'] += v.gasto * 0.15
    })
    const filaLocal = Object.values(porLocal).map(r => ({
      ...r,
      'Volumen Total (€)': parseFloat(r['Volumen Total (€)'].toFixed(2)),
      'Comisión (€)': parseFloat(r['Comisión (€)'].toFixed(2)),
    }))

    // --- HOJA 4: Liquidaciones ---
    const filaLiq = (liquidaciones || []).map(l => ({
      'Fecha': new Date(l.created_at).toLocaleDateString('es-ES'),
      'Promotor': l.referidores?.nombre || '—',
      'Email': l.referidores?.email || '—',
      'Período desde': l.periodo_desde,
      'Período hasta': l.periodo_hasta,
      'Importe (€)': parseFloat(parseFloat(l.importe).toFixed(2)),
      'Estado': l.estado === 'pagado' ? 'Pagado' : 'Pendiente',
      'Fecha pago': l.pagado_at ? new Date(l.pagado_at).toLocaleDateString('es-ES') : '—',
      'Notas': l.notas || '',
    }))

    // --- HOJA 5: Directorio promotores ---
    const filaRef = (referidores || []).map(r => ({
      'Nombre': r.nombre,
      'Email': r.email,
      'Estado': r.activo ? 'Activo' : 'Suspendido',
      'Alta': new Date(r.created_at).toLocaleDateString('es-ES'),
    }))

    // Construir libro Excel
    const wb = XLSX.utils.book_new()

    const ws1 = XLSX.utils.json_to_sheet(filaOps.length ? filaOps : [{ Info: 'Sin operaciones' }])
    const ws2 = XLSX.utils.json_to_sheet(filaPromotor.length ? filaPromotor : [{ Info: 'Sin datos' }])
    const ws3 = XLSX.utils.json_to_sheet(filaLocal.length ? filaLocal : [{ Info: 'Sin datos' }])
    const ws4 = XLSX.utils.json_to_sheet(filaLiq.length ? filaLiq : [{ Info: 'Sin liquidaciones' }])
    const ws5 = XLSX.utils.json_to_sheet(filaRef.length ? filaRef : [{ Info: 'Sin promotores' }])

    // Anchos de columna
    ws1['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 28 }, { wch: 10 }, { wch: 14 }, { wch: 24 }]
    ws2['!cols'] = [{ wch: 22 }, { wch: 28 }, { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 24 }]
    ws3['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 16 }]
    ws4['!cols'] = [{ wch: 14 }, { wch: 22 }, { wch: 26 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 30 }]
    ws5['!cols'] = [{ wch: 22 }, { wch: 28 }, { wch: 12 }, { wch: 16 }]

    XLSX.utils.book_append_sheet(wb, ws1, 'Operaciones')
    XLSX.utils.book_append_sheet(wb, ws2, 'Por Promotor')
    XLSX.utils.book_append_sheet(wb, ws3, 'Por Local')
    XLSX.utils.book_append_sheet(wb, ws4, 'Liquidaciones')
    XLSX.utils.book_append_sheet(wb, ws5, 'Promotores')

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    const fecha = new Date().toISOString().split('T')[0]

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="ElCodigo_Export_${fecha}.xlsx"`,
      }
    })
  } catch (e) {
    console.error('Error exportando xlsx:', e)
    return NextResponse.json({ error: 'Fallo al generar el Excel.' }, { status: 500 })
  }
}
