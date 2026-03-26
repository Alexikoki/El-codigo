import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { verificarToken, extraerTokenDeCookie } from '../../../../lib/jwt'
import PDFDocument from 'pdfkit'

export async function GET(request) {
  const payload = verificarToken(extraerTokenDeCookie(request))
  if (!payload || !['superadmin', 'manager', 'agencia'].includes(payload.rol)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')

  // Obtener liquidaciones según el rol
  let query = supabaseAdmin
    .from('liquidaciones')
    .select('*, referidores(nombre, email), agencias(nombre)')
    .order('created_at', { ascending: false })

  if (payload.rol === 'manager') {
    query = query.eq('lugar_id', payload.lugarId)
  } else if (payload.rol === 'agencia') {
    const { data: promotores } = await supabaseAdmin
      .from('referidores').select('id').eq('agencia_id', payload.agenciaId)
    const ids = (promotores || []).map(p => p.id)
    if (ids.length > 0) {
      query = query.or(`referidor_id.in.(${ids.join(',')}),agencia_id.eq.${payload.agenciaId}`)
    } else {
      query = query.eq('agencia_id', payload.agenciaId)
    }
  }

  if (desde) query = query.gte('periodo_desde', desde)
  if (hasta) query = query.lte('periodo_hasta', hasta)

  const { data: liquidaciones, error } = await query
  if (error) return NextResponse.json({ error: 'Error obteniendo liquidaciones' }, { status: 500 })

  // Generar PDF
  const chunks = []
  const doc = new PDFDocument({ margin: 50, size: 'A4' })

  doc.on('data', chunk => chunks.push(chunk))

  // Colores
  const azul = '#1e3a5f'
  const gris = '#6b7280'
  const grisClaro = '#f3f4f6'
  const verde = '#16a34a'
  const naranja = '#d97706'

  // Cabecera
  doc.rect(0, 0, doc.page.width, 80).fill(azul)
  doc.fill('white').fontSize(22).font('Helvetica-Bold').text('El Código', 50, 25)
  doc.fontSize(10).font('Helvetica').text('Informe de Liquidaciones', 50, 52)

  // Fecha de generación
  doc.fill(gris).fontSize(9).text(
    `Generado el ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    doc.page.width - 200, 55,
    { width: 150, align: 'right' }
  )

  doc.moveDown(3)

  // Período si aplica
  if (desde || hasta) {
    doc.fill(azul).fontSize(10).font('Helvetica-Bold')
      .text(`Período: ${desde || '—'} hasta ${hasta || '—'}`, 50, doc.y)
    doc.moveDown(0.5)
  }

  // Resumen
  const totalImporte = liquidaciones.reduce((s, l) => s + (l.importe || 0), 0)
  const totalPagadas = liquidaciones.filter(l => l.estado === 'pagado').length
  const totalPendientes = liquidaciones.filter(l => l.estado === 'pendiente').length

  const resumenY = doc.y + 10
  doc.rect(50, resumenY, doc.page.width - 100, 60).fill(grisClaro)

  doc.fill('#111111').fontSize(10).font('Helvetica-Bold')
  doc.text('Resumen', 65, resumenY + 12)

  doc.fontSize(9).font('Helvetica').fill(gris)
  doc.text(`Total liquidaciones: ${liquidaciones.length}`, 65, resumenY + 28)
  doc.text(`Pagadas: ${totalPagadas}`, 65, resumenY + 42)
  doc.text(`Pendientes: ${totalPendientes}`, 200, resumenY + 28)
  doc.fill('#111111').fontSize(11).font('Helvetica-Bold')
  doc.text(`Total: €${totalImporte.toFixed(2)}`, doc.page.width - 180, resumenY + 28, { width: 130, align: 'right' })

  doc.y = resumenY + 75

  // Cabecera de tabla
  const colX = [50, 160, 280, 360, 450]
  const colLabels = ['Período', 'Destinatario', 'Importe', 'Estado', 'Pagado']

  doc.rect(50, doc.y, doc.page.width - 100, 22).fill(azul)
  doc.fill('white').fontSize(8).font('Helvetica-Bold')
  colLabels.forEach((label, i) => {
    doc.text(label, colX[i] + 4, doc.y - 18, { width: 100 })
  })
  doc.moveDown(0.3)

  // Filas
  liquidaciones.forEach((liq, idx) => {
    if (doc.y > doc.page.height - 100) {
      doc.addPage()
      doc.y = 50
    }

    const rowY = doc.y
    const rowH = 26
    const bg = idx % 2 === 0 ? 'white' : '#f9fafb'
    doc.rect(50, rowY, doc.page.width - 100, rowH).fill(bg)

    const nombre = liq.referidores?.nombre || liq.agencias?.nombre || '—'
    const periodo = `${liq.periodo_desde || '—'} / ${liq.periodo_hasta || '—'}`
    const importe = `€${(liq.importe || 0).toFixed(2)}`
    const estado = liq.estado === 'pagado' ? 'Pagado' : 'Pendiente'
    const pagadoAt = liq.pagado_at
      ? new Date(liq.pagado_at).toLocaleDateString('es-ES')
      : '—'

    doc.fill('#374151').fontSize(7.5).font('Helvetica')
    doc.text(periodo, colX[0] + 4, rowY + 8, { width: 105 })
    doc.text(nombre, colX[1] + 4, rowY + 8, { width: 115 })
    doc.fill('#111111').font('Helvetica-Bold')
    doc.text(importe, colX[2] + 4, rowY + 8, { width: 75 })
    doc.fill(liq.estado === 'pagado' ? verde : naranja).font('Helvetica')
    doc.text(estado, colX[3] + 4, rowY + 8, { width: 85 })
    doc.fill('#374151')
    doc.text(pagadoAt, colX[4] + 4, rowY + 8, { width: 80 })

    doc.y = rowY + rowH
  })

  if (liquidaciones.length === 0) {
    doc.fill(gris).fontSize(10).font('Helvetica')
      .text('No hay liquidaciones en el período seleccionado.', 50, doc.y + 20, { align: 'center' })
  }

  // Pie de página
  const footerY = doc.page.height - 40
  doc.rect(0, footerY, doc.page.width, 40).fill(grisClaro)
  doc.fill(gris).fontSize(8).font('Helvetica')
    .text('El Código — Plataforma de referidos para hostelería', 50, footerY + 14)
  doc.text(`Página 1 · Documento generado automáticamente`, doc.page.width - 250, footerY + 14, { width: 200, align: 'right' })

  doc.end()

  const buffer = await new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })

  const nombreArchivo = `liquidaciones_${desde || 'todo'}_${hasta || 'todo'}.pdf`

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
      'Content-Length': buffer.length.toString(),
    },
  })
}
