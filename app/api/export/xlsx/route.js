import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { supabaseAdmin } from '../../../../lib/supabase'
import { requireAuth } from '../../../../lib/auth'
import logger from '../../../../lib/logger'

export async function GET(request) {
  try {
    const { payload, response } = requireAuth(request, 'superadmin')
    if (response) return response

    const { data: valoraciones, error } = await supabaseAdmin
      .from('valoraciones')
      .select('created_at, gasto, comision_lugar, num_personas, referidor_id, referidores(nombre, email), lugares(nombre)')
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

    const wb = new ExcelJS.Workbook()

    // --- HOJA 1: Operaciones detalladas ---
    const ws1 = wb.addWorksheet('Operaciones')
    ws1.columns = [
      { header: 'Fecha',                      key: 'fecha',      width: 22 },
      { header: 'Local',                       key: 'local',      width: 22 },
      { header: 'Promotor / RRPP',             key: 'promotor',   width: 24 },
      { header: 'Email Promotor',              key: 'email',      width: 28 },
      { header: 'Personas',                    key: 'personas',   width: 10 },
      { header: 'Gasto (€)',                   key: 'gasto',      width: 14 },
      { header: 'Comisión Plataforma (€)',     key: 'comision',   width: 24 },
    ]
    ;(valoraciones || []).forEach(v => {
      ws1.addRow({
        fecha:    new Date(v.created_at).toLocaleString('es-ES'),
        local:    v.lugares?.nombre || '—',
        promotor: v.referidores?.nombre || '—',
        email:    v.referidores?.email || '—',
        personas: v.num_personas || 1,
        gasto:    parseFloat((v.gasto || 0).toFixed(2)),
        comision: parseFloat((v.comision_lugar || 0).toFixed(2)),
      })
    })

    // --- HOJA 2: Resumen por promotor ---
    const ws2 = wb.addWorksheet('Por Promotor')
    ws2.columns = [
      { header: 'Promotor',                key: 'promotor',   width: 24 },
      { header: 'Email',                   key: 'email',      width: 28 },
      { header: 'Operaciones',             key: 'ops',        width: 14 },
      { header: 'Personas Traídas',        key: 'personas',   width: 18 },
      { header: 'Volumen Total (€)',        key: 'volumen',    width: 20 },
      { header: 'Comisión Plataforma (€)', key: 'comision',   width: 24 },
    ]
    const porPromotor = {}
    ;(valoraciones || []).forEach(v => {
      const key = v.referidor_id
      if (!porPromotor[key]) {
        porPromotor[key] = { promotor: v.referidores?.nombre || '—', email: v.referidores?.email || '—', ops: 0, personas: 0, volumen: 0, comision: 0 }
      }
      porPromotor[key].ops += 1
      porPromotor[key].personas += v.num_personas || 1
      porPromotor[key].volumen += v.gasto || 0
      porPromotor[key].comision += v.comision_lugar || 0
    })
    Object.values(porPromotor).forEach(r => {
      ws2.addRow({ ...r, volumen: parseFloat(r.volumen.toFixed(2)), comision: parseFloat(r.comision.toFixed(2)) })
    })

    // --- HOJA 3: Resumen por local ---
    const ws3 = wb.addWorksheet('Por Local')
    ws3.columns = [
      { header: 'Local',            key: 'local',    width: 24 },
      { header: 'Operaciones',      key: 'ops',      width: 14 },
      { header: 'Personas',         key: 'personas', width: 12 },
      { header: 'Volumen Total (€)', key: 'volumen', width: 20 },
      { header: 'Comisión (€)',     key: 'comision', width: 16 },
    ]
    const porLocal = {}
    ;(valoraciones || []).forEach(v => {
      const key = v.lugares?.nombre || '—'
      if (!porLocal[key]) {
        porLocal[key] = { local: key, ops: 0, personas: 0, volumen: 0, comision: 0 }
      }
      porLocal[key].ops += 1
      porLocal[key].personas += v.num_personas || 1
      porLocal[key].volumen += v.gasto || 0
      porLocal[key].comision += v.comision_lugar || 0
    })
    Object.values(porLocal).forEach(r => {
      ws3.addRow({ ...r, volumen: parseFloat(r.volumen.toFixed(2)), comision: parseFloat(r.comision.toFixed(2)) })
    })

    // --- HOJA 4: Liquidaciones ---
    const ws4 = wb.addWorksheet('Liquidaciones')
    ws4.columns = [
      { header: 'Fecha',         key: 'fecha',   width: 14 },
      { header: 'Promotor',      key: 'promotor',width: 24 },
      { header: 'Email',         key: 'email',   width: 28 },
      { header: 'Período desde', key: 'desde',   width: 16 },
      { header: 'Período hasta', key: 'hasta',   width: 16 },
      { header: 'Importe (€)',   key: 'importe', width: 14 },
      { header: 'Estado',        key: 'estado',  width: 12 },
      { header: 'Fecha pago',    key: 'pagado',  width: 14 },
      { header: 'Notas',         key: 'notas',   width: 30 },
    ]
    ;(liquidaciones || []).forEach(l => {
      ws4.addRow({
        fecha:    new Date(l.created_at).toLocaleDateString('es-ES'),
        promotor: l.referidores?.nombre || '—',
        email:    l.referidores?.email || '—',
        desde:    l.periodo_desde,
        hasta:    l.periodo_hasta,
        importe:  parseFloat(parseFloat(l.importe).toFixed(2)),
        estado:   l.estado === 'pagado' ? 'Pagado' : 'Pendiente',
        pagado:   l.pagado_at ? new Date(l.pagado_at).toLocaleDateString('es-ES') : '—',
        notas:    l.notas || '',
      })
    })

    // --- HOJA 5: Directorio promotores ---
    const ws5 = wb.addWorksheet('Promotores')
    ws5.columns = [
      { header: 'Nombre', key: 'nombre', width: 24 },
      { header: 'Email',  key: 'email',  width: 28 },
      { header: 'Estado', key: 'estado', width: 12 },
      { header: 'Alta',   key: 'alta',   width: 16 },
    ]
    ;(referidores || []).forEach(r => {
      ws5.addRow({
        nombre: r.nombre,
        email:  r.email,
        estado: r.activo ? 'Activo' : 'Suspendido',
        alta:   new Date(r.created_at).toLocaleDateString('es-ES'),
      })
    })

    const buffer = await wb.xlsx.writeBuffer()
    const fecha = new Date().toISOString().split('T')[0]

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="ElCodigo_Export_${fecha}.xlsx"`,
      }
    })
  } catch (e) {
    logger.error({ err: e }, 'Error exportando xlsx:')
    return NextResponse.json({ error: 'Fallo al generar el Excel.' }, { status: 500 })
  }
}
