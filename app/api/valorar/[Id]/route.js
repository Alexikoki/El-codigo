import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'

export async function GET(request, { params }) {
  try {
    const { id } = params

    const { data: val, error } = await supabaseAdmin
      .from('valoraciones')
      .select('*, lugares(nombre, descuento), clientes(nombre)')
      .eq('cliente_id', id)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: 'Error consultando valoración' }, { status: 500 })
    }

    // No valoracion record or no spend confirmed yet → pending
    if (!val || val.gasto_confirmado == null) {
      return NextResponse.json({ pendiente: true })
    }

    // Already rated
    if (val.valoracion != null) {
      return NextResponse.json({ yaValorado: true })
    }

    return NextResponse.json({
      gasto: val.gasto_confirmado,
      lugar: { nombre: val.lugares?.nombre, descuento: val.lugares?.descuento },
      cliente: { nombre: val.clientes?.nombre }
    })
  } catch (globalError) {
    console.error('Crash API /valorar GET:', globalError)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = params

    const formData = await request.formData()
    const valoracionRaw = formData.get('valoracion')
    const gastoClienteRaw = formData.get('gasto_cliente')
    const foto = formData.get('foto')

    const valoracion = parseInt(valoracionRaw, 10)
    if (!valoracion || valoracion < 1 || valoracion > 5) {
      return NextResponse.json({ error: 'Valoración inválida (1-5)' }, { status: 400 })
    }

    const gastoCliente = gastoClienteRaw ? parseFloat(gastoClienteRaw) : null

    // Get the existing valoracion record
    const { data: val, error: valError } = await supabaseAdmin
      .from('valoraciones')
      .select('id, valoracion, gasto_confirmado')
      .eq('cliente_id', id)
      .maybeSingle()

    if (valError || !val) {
      return NextResponse.json({ error: 'Valoración no encontrada. El local debe confirmar la visita primero.' }, { status: 404 })
    }

    if (val.valoracion != null) {
      return NextResponse.json({ error: 'Esta visita ya fue valorada.' }, { status: 400 })
    }

    // Upload photo if provided
    const MAX_FOTO_SIZE = 5 * 1024 * 1024 // 5MB
    const VALID_FOTO_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic' }
    let ticketUrl = null
    if (foto && foto.size > 0) {
      if (foto.size > MAX_FOTO_SIZE) return NextResponse.json({ error: 'Imagen demasiado grande (máx 5MB)' }, { status: 400 })
      if (!VALID_FOTO_TYPES[foto.type]) return NextResponse.json({ error: 'Formato de imagen no válido' }, { status: 400 })
      const buffer = Buffer.from(await foto.arrayBuffer())
      const ext = VALID_FOTO_TYPES[foto.type]
      const fileName = `review_${id}_${Date.now()}.${ext}`

      const { error: uploadError } = await supabaseAdmin.storage
        .from('tickets')
        .upload(fileName, buffer, { contentType: foto.type, upsert: false })

      if (!uploadError) {
        const { data: urlData } = supabaseAdmin.storage
          .from('tickets')
          .getPublicUrl(fileName)
        ticketUrl = urlData?.publicUrl || null
      }
    }

    const now = new Date().toISOString()

    // Calcular discrepancia si el cliente indicó su gasto
    let discrepancia_pct = null
    if (gastoCliente != null && val.gasto_confirmado > 0) {
      discrepancia_pct = Math.abs(gastoCliente - val.gasto_confirmado) / val.gasto_confirmado * 100
    }

    // Update valoracion record
    await supabaseAdmin
      .from('valoraciones')
      .update({
        valoracion,
        ...(gastoCliente != null ? { gasto_cliente: gastoCliente } : {}),
        ...(discrepancia_pct != null ? { discrepancia_pct } : {}),
        ...(ticketUrl ? { ticket_url: ticketUrl } : {}),
        valorado_at: now
      })
      .eq('id', val.id)

    // Update clientes table
    await supabaseAdmin
      .from('clientes')
      .update({ valoracion, valorado_at: now })
      .eq('id', id)

    return NextResponse.json({ ok: true })
  } catch (globalError) {
    console.error('Crash API /valorar POST:', globalError)
    return NextResponse.json({ error: 'Error interno registrando la valoración.' }, { status: 500 })
  }
}
