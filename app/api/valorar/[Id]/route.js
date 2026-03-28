import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { validarImagen } from '../../../../lib/uploads'
import { ajustarComisionesPorDiscrepancia } from '../../../../lib/commissions'
import logger from '../../../../lib/logger'

export async function GET(request, { params }) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('t')

    const { data: val, error } = await supabaseAdmin
      .from('valoraciones')
      .select('*, lugares(nombre, descuento), clientes(nombre)')
      .eq('cliente_id', id)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: 'Error consultando valoración' }, { status: 500 })
    }

    if (!val || val.gasto_confirmado == null) {
      return NextResponse.json({ pendiente: true })
    }

    if (val.token_valoracion && val.token_valoracion !== token) {
      return NextResponse.json({ error: 'Enlace inválido o expirado' }, { status: 403 })
    }

    if (val.valoracion != null) {
      return NextResponse.json({ yaValorado: true })
    }

    return NextResponse.json({
      gasto: val.gasto_confirmado,
      lugar: { nombre: val.lugares?.nombre, descuento: val.lugares?.descuento },
      cliente: { nombre: val.clientes?.nombre }
    })
  } catch (e) {
    logger.error({ err: e }, 'Error /valorar GET:')
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
    const tokenParam = formData.get('token')

    const valoracion = parseInt(valoracionRaw, 10)
    if (!valoracion || valoracion < 1 || valoracion > 5) {
      return NextResponse.json({ error: 'Valoración inválida (1-5)' }, { status: 400 })
    }

    const gastoCliente = gastoClienteRaw ? parseFloat(gastoClienteRaw) : null

    const { data: val, error: valError } = await supabaseAdmin
      .from('valoraciones')
      .select('id, valoracion, gasto_confirmado, comision_lugar, comision_agencia, comision_referidor, lugar_id, referidor_id, token_valoracion, referidores(agencia_id)')
      .eq('cliente_id', id)
      .maybeSingle()

    if (valError || !val) {
      return NextResponse.json({ error: 'Valoración no encontrada. El local debe confirmar la visita primero.' }, { status: 404 })
    }

    if (val.token_valoracion && val.token_valoracion !== tokenParam) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 403 })
    }

    if (val.valoracion != null) {
      return NextResponse.json({ error: 'Esta visita ya fue valorada.' }, { status: 400 })
    }

    // Validar y subir foto con lib centralizada
    let ticketUrl = null
    if (foto && foto.size > 0) {
      const check = validarImagen(foto)
      if (!check.valid) return check.response

      const buffer = Buffer.from(await foto.arrayBuffer())
      const fileName = `review_${id}_${Date.now()}.${check.ext}`

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

    // Discrepancia y recálculo de comisiones con lib centralizada
    let discrepancia_pct = null
    let comisionUpdate = {}
    if (gastoCliente != null && gastoCliente > 0 && val.gasto_confirmado > 0) {
      discrepancia_pct = Math.abs(gastoCliente - val.gasto_confirmado) / val.gasto_confirmado * 100

      if (gastoCliente < val.gasto_confirmado && val.comision_lugar > 0) {
        const ajuste = ajustarComisionesPorDiscrepancia(
          { comLugar: val.comision_lugar, comAgencia: val.comision_agencia, comReferidor: val.comision_referidor },
          gastoCliente,
          val.gasto_confirmado
        )

        if (ajuste) {
          comisionUpdate = ajuste

          // Actualizar liquidaciones en paralelo
          const updates = []
          if (val.referidor_id && ajuste.comision_referidor > 0) {
            updates.push(
              supabaseAdmin.from('liquidaciones')
                .update({ importe: ajuste.comision_referidor })
                .eq('cliente_id', id)
                .eq('referidor_id', val.referidor_id)
                .eq('estado', 'pendiente')
            )
          }
          const agenciaId = val.referidores?.agencia_id
          if (ajuste.comision_agencia > 0 && agenciaId) {
            updates.push(
              supabaseAdmin.from('liquidaciones')
                .update({ importe: ajuste.comision_agencia })
                .eq('cliente_id', id)
                .eq('agencia_id', agenciaId)
                .eq('estado', 'pendiente')
            )
          }
          if (updates.length > 0) await Promise.all(updates)
        }
      }
    }

    // Actualizar valoración y cliente en paralelo
    await Promise.all([
      supabaseAdmin
        .from('valoraciones')
        .update({
          valoracion,
          ...(gastoCliente != null ? { gasto_cliente: gastoCliente } : {}),
          ...(discrepancia_pct != null ? { discrepancia_pct } : {}),
          ...(ticketUrl ? { ticket_url: ticketUrl } : {}),
          ...comisionUpdate,
          valorado_at: now
        })
        .eq('id', val.id),
      supabaseAdmin
        .from('clientes')
        .update({ valoracion, valorado_at: now })
        .eq('id', id)
    ])

    return NextResponse.json({ ok: true })
  } catch (e) {
    logger.error({ err: e }, 'Error /valorar POST:')
    return NextResponse.json({ error: 'Error interno registrando la valoración.' }, { status: 500 })
  }
}
