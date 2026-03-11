import { NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { supabaseAdmin } from '../../../lib/supabase'
import { verificarToken, extraerToken } from '../../../lib/jwt'

// Definimos estilos básicos para el PDF
const styles = StyleSheet.create({
    page: { flexDirection: 'column', backgroundColor: '#ffffff', padding: 40 },
    header: { fontSize: 24, marginBottom: 20, textAlign: 'center', color: '#1a1a1a', fontWeight: 'bold' },
    section: { margin: 10, padding: 10, flexGrow: 1 },
    text: { fontSize: 12, marginBottom: 5, color: '#333' },
    row: { flexDirection: 'row', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: 5, marginBottom: 5 },
    total: { fontSize: 16, marginTop: 20, textAlign: 'right', fontWeight: 'bold' },
    footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 10, color: '#888' }
})

// Plantilla del PDF
const FacturaPDF = ({ datos }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <Text style={styles.header}>Recibo de Honorarios Profesionales</Text>

            <View style={{ marginBottom: 30 }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>Emisor (Plataforma El Código):</Text>
                <Text style={styles.text}>El Código S.L.</Text>
                <Text style={styles.text}>NIF: B00000000</Text>
                <Text style={styles.text}>Fecha de Emisión: {new Date().toLocaleDateString('es-ES')}</Text>
            </View>

            <View style={{ marginBottom: 30 }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>Receptor (Promotor / Relaciones Públicas):</Text>
                <Text style={styles.text}>Nombre: {datos.referidor.nombre}</Text>
                <Text style={styles.text}>Email: {datos.referidor.email}</Text>
            </View>

            <View style={styles.section}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 15, borderBottom: '2px solid #3b82f6', paddingBottom: 5 }}>Detalle de Conversiones</Text>

                <View style={{ ...styles.row, fontWeight: 'bold', color: '#000' }}>
                    <Text style={{ width: '40%' }}>Fecha de Validación</Text>
                    <Text style={{ width: '30%', textAlign: 'center' }}>Volumen Traído</Text>
                    <Text style={{ width: '30%', textAlign: 'right' }}>Comisión (15%)</Text>
                </View>

                {datos.valoraciones.map((v, i) => (
                    <View style={styles.row} key={i}>
                        <Text style={{ width: '40%', fontSize: 10 }}>{new Date(v.created_at).toLocaleDateString()}</Text>
                        <Text style={{ width: '30%', textAlign: 'center', fontSize: 10 }}>{v.gasto.toFixed(2)}€</Text>
                        <Text style={{ width: '30%', textAlign: 'right', fontSize: 10 }}>{(v.gasto * 0.15).toFixed(2)}€</Text>
                    </View>
                ))}

                <Text style={styles.total}>Total a Liquidar: {datos.totalComision.toFixed(2)}€</Text>
            </View>

            <Text style={styles.footer}>Documento auto-generado por el Centro de Mando de El Código.</Text>
        </Page>
    </Document>
)

export async function GET(request) {
    try {
        const payload = verificarToken(extraerToken(request))
        if (!payload || payload.rol !== 'superadmin') {
            return NextResponse.json({ error: 'Prohibido: Solo Superadmin puede emitir pagos.' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const referidorId = searchParams.get('referidorid')

        if (!referidorId) return NextResponse.json({ error: 'Falta el ID del referidor.' }, { status: 400 })

        // Extraemos Datos de BD
        const { data: refData } = await supabaseAdmin.from('referidores').select('nombre, email').eq('id', referidorId).single()
        const { data: valData } = await supabaseAdmin.from('valoraciones').select('gasto, created_at').eq('referidor_id', referidorId).order('created_at', { ascending: false })

        if (!refData) return NextResponse.json({ error: 'Datos incoherentes.' }, { status: 404 })

        const datosCompilados = {
            referidor: refData,
            valoraciones: valData || [],
            totalComision: (valData || []).reduce((acc, curr) => acc + (curr.gasto * 0.15), 0)
        }

        // Convertimos la plantilla a Buffer Stream para descarga HTTP
        // eslint-disable-next-line react-hooks/error-boundaries
        const stream = await renderToStream(<FacturaPDF datos={datosCompilados} />)

        // Devolvemos la respuesta como un flujo de archivo PDF puro
        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Liquidacion_${refData.nombre.replace(/\s+/g, '_')}.pdf"`
            }
        })

    } catch (error) {
        console.error('Error generando Factura PDF:', error)
        return NextResponse.json({ error: 'Fallo al empaquetar PDF.' }, { status: 500 })
    }
}
