import { NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import React from 'react'
import { Document, Page, Text, View, StyleSheet, Svg, Line } from '@react-pdf/renderer'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireAuth } from '../../../lib/auth'
import logger from '../../../lib/logger'

const C = {
  navy: '#1e3a5f',
  navyLight: '#2d5282',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray300: '#d1d5db',
  gray500: '#6b7280',
  gray700: '#374151',
  black: '#111111',
  white: '#ffffff',
  green: '#15803d',
  greenBg: '#f0fdf4',
}

const styles = StyleSheet.create({
  page: { backgroundColor: C.white, padding: 0, fontFamily: 'Helvetica' },

  // Cabecera azul marino
  header: {
    backgroundColor: C.navy,
    padding: '32 40',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {},
  headerTitle: { fontSize: 22, color: C.white, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 10, color: '#93c5fd', marginTop: 4 },
  headerRight: { alignItems: 'flex-end' },
  headerLabel: { fontSize: 9, color: '#93c5fd', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.8 },
  headerValue: { fontSize: 11, color: C.white, fontFamily: 'Helvetica-Bold' },

  // Cuerpo
  body: { padding: '28 40' },

  // Sección info emisor/receptor
  infoGrid: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  infoBox: { flex: 1, backgroundColor: C.gray50, borderRadius: 6, padding: '14 16', border: `1 solid ${C.gray300}` },
  infoBoxLabel: { fontSize: 8, color: C.gray500, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, fontFamily: 'Helvetica-Bold' },
  infoBoxName: { fontSize: 12, color: C.black, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  infoBoxText: { fontSize: 10, color: C.gray700, marginBottom: 2 },

  // Tabla
  tableHeader: { flexDirection: 'row', backgroundColor: C.navy, borderRadius: '4 4 0 0', paddingVertical: 8, paddingHorizontal: 12 },
  tableHeaderCell: { fontSize: 9, color: C.white, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.6 },
  tableRow: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 12, borderBottom: `1 solid ${C.gray100}` },
  tableRowAlt: { backgroundColor: C.gray50 },
  tableCell: { fontSize: 10, color: C.gray700 },

  colFecha: { width: '38%' },
  colPersonas: { width: '18%', textAlign: 'center' },
  colGasto: { width: '22%', textAlign: 'right' },
  colComision: { width: '22%', textAlign: 'right' },

  // Totales
  totalBox: {
    backgroundColor: C.navy,
    borderRadius: 6,
    padding: '14 16',
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 11, color: '#93c5fd', fontFamily: 'Helvetica-Bold' },
  totalValue: { fontSize: 20, color: C.white, fontFamily: 'Helvetica-Bold' },

  // Subtotales
  subtotales: { flexDirection: 'row', gap: 10, marginTop: 10 },
  subtotalCard: { flex: 1, border: `1 solid ${C.gray300}`, borderRadius: 6, padding: '10 14', backgroundColor: C.gray50 },
  subtotalLabel: { fontSize: 8, color: C.gray500, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 },
  subtotalValue: { fontSize: 13, color: C.black, fontFamily: 'Helvetica-Bold' },

  // Footer
  footer: { marginTop: 28, paddingTop: 14, borderTop: `1 solid ${C.gray300}` },
  footerText: { fontSize: 8, color: C.gray500, textAlign: 'center', lineHeight: 1.5 },
})

const FacturaPDF = ({ datos }) => {
  const hoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
  const totalGasto = datos.totalGasto
  const totalComision = datos.totalComision
  const totalPersonas = datos.totalPersonas

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* CABECERA */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>El Código</Text>
            <Text style={styles.headerSubtitle}>Liquidación de Comisiones · Promotor R.R.P.P.</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerLabel}>Fecha de emisión</Text>
            <Text style={styles.headerValue}>{hoy}</Text>
          </View>
        </View>

        <View style={styles.body}>

          {/* INFO GRID */}
          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxLabel}>Emisor</Text>
              <Text style={styles.infoBoxName}>El Código S.L.</Text>
              <Text style={styles.infoBoxText}>Plataforma de gestión turística</Text>
              <Text style={styles.infoBoxText}>NIF: B00000000</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxLabel}>Promotor / RRPP</Text>
              <Text style={styles.infoBoxName}>{datos.referidor.nombre}</Text>
              <Text style={styles.infoBoxText}>{datos.referidor.email}</Text>
            </View>
          </View>

          {/* TABLA */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colFecha]}>Fecha</Text>
            <Text style={[styles.tableHeaderCell, styles.colPersonas, { textAlign: 'center' }]}>Personas</Text>
            <Text style={[styles.tableHeaderCell, styles.colGasto, { textAlign: 'right' }]}>Gasto (€)</Text>
            <Text style={[styles.tableHeaderCell, styles.colComision, { textAlign: 'right' }]}>Comisión (€)</Text>
          </View>

          {datos.valoraciones.map((v, i) => (
            <View style={[styles.tableRow, i % 2 !== 0 && styles.tableRowAlt]} key={i}>
              <Text style={[styles.tableCell, styles.colFecha]}>
                {new Date(v.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Text>
              <Text style={[styles.tableCell, styles.colPersonas, { textAlign: 'center' }]}>
                {v.num_personas || 1}
              </Text>
              <Text style={[styles.tableCell, styles.colGasto, { textAlign: 'right', fontFamily: 'Helvetica-Bold', color: C.black }]}>
                {v.gasto.toFixed(2)}€
              </Text>
              <Text style={[styles.tableCell, styles.colComision, { textAlign: 'right', color: C.green }]}>
                {(v.gasto * 0.15).toFixed(2)}€
              </Text>
            </View>
          ))}

          {/* SUBTOTALES */}
          <View style={styles.subtotales}>
            <View style={styles.subtotalCard}>
              <Text style={styles.subtotalLabel}>Total operaciones</Text>
              <Text style={styles.subtotalValue}>{datos.valoraciones.length}</Text>
            </View>
            <View style={styles.subtotalCard}>
              <Text style={styles.subtotalLabel}>Personas traídas</Text>
              <Text style={styles.subtotalValue}>{totalPersonas}</Text>
            </View>
            <View style={styles.subtotalCard}>
              <Text style={styles.subtotalLabel}>Volumen generado</Text>
              <Text style={styles.subtotalValue}>{totalGasto.toFixed(2)}€</Text>
            </View>
          </View>

          {/* TOTAL */}
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total a liquidar al promotor</Text>
            <Text style={styles.totalValue}>{totalComision.toFixed(2)}€</Text>
          </View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Documento auto-generado por El Código · Solo válido como recibo interno · {hoy}
            </Text>
          </View>

        </View>
      </Page>
    </Document>
  )
}

export async function GET(request) {
  try {
    const { payload, response } = requireAuth(request, 'superadmin')
    if (response) return response

    const { searchParams } = new URL(request.url)
    const referidorId = searchParams.get('referidorid')
    if (!referidorId) return NextResponse.json({ error: 'Falta el ID del referidor.' }, { status: 400 })

    const { data: refData } = await supabaseAdmin
      .from('referidores').select('nombre, email').eq('id', referidorId).single()
    const { data: valData } = await supabaseAdmin
      .from('valoraciones')
      .select('gasto, num_personas, created_at')
      .eq('referidor_id', referidorId)
      .order('created_at', { ascending: false })

    if (!refData) return NextResponse.json({ error: 'Referidor no encontrado.' }, { status: 404 })

    const vals = valData || []
    const datosCompilados = {
      referidor: refData,
      valoraciones: vals,
      totalGasto: vals.reduce((acc, v) => acc + (v.gasto || 0), 0),
      totalComision: vals.reduce((acc, v) => acc + (v.gasto * 0.15), 0),
      totalPersonas: vals.reduce((acc, v) => acc + (v.num_personas || 1), 0),
    }

    const stream = await renderToStream(<FacturaPDF datos={datosCompilados} />)

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Liquidacion_${refData.nombre.replace(/\s+/g, '_')}.pdf"`
      }
    })
  } catch (error) {
    logger.error({ err: error }, 'Error generando PDF:')
    return NextResponse.json({ error: 'Fallo al generar el PDF.' }, { status: 500 })
  }
}
