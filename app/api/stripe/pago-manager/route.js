import { NextResponse } from 'next/server'
import { stripe, PLATAFORMA_PCT } from '../../../../lib/stripe'
import { supabaseAdmin } from '../../../../lib/supabase'
import { requireAuth } from '../../../../lib/auth'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://itrustb2b.com'

// POST — manager inicia el pago de sus comisiones del mes
export async function POST(request) {
  const { payload, response } = requireAuth(request, 'manager')
  if (response) return response

  const { periodo_desde, periodo_hasta } = await request.json()
  if (!periodo_desde || !periodo_hasta) {
    return NextResponse.json({ error: 'Falta el período' }, { status: 400 })
  }

  // Obtener datos del lugar + comisión acordada
  const { data: lugar } = await supabaseAdmin
    .from('lugares')
    .select('id, nombre, porcentaje_plataforma')
    .eq('id', payload.lugarId)
    .single()

  if (!lugar) return NextResponse.json({ error: 'Local no encontrado' }, { status: 404 })

  // Calcular volumen de ventas del período (suma de tickets del local)
  const { data: valoraciones } = await supabaseAdmin
    .from('valoraciones')
    .select('gasto')
    .eq('lugar_id', payload.lugarId)
    .gte('created_at', periodo_desde)
    .lte('created_at', periodo_hasta + 'T23:59:59')
    .not('gasto', 'is', null)

  const volumenTotal = (valoraciones || []).reduce((sum, v) => sum + (v.gasto || 0), 0)

  if (volumenTotal === 0) {
    return NextResponse.json({ error: 'No hay consumo registrado en este período' }, { status: 400 })
  }

  // Comisión total = volumen × % acordado con el local
  const pctLocal = (lugar.porcentaje_plataforma || 20) / 100
  const comisionTotal = parseFloat((volumenTotal * pctLocal).toFixed(2))

  // Parte de la plataforma = 5% de la comisión
  const comisionPlataforma = parseFloat((comisionTotal * PLATAFORMA_PCT).toFixed(2))

  // Parte para referidores/agencias = resto
  const comisionRepartir = parseFloat((comisionTotal - comisionPlataforma).toFixed(2))

  // Obtener referidores/agencias que trajeron clientes en este período y su stripe_account_id
  const { data: valoracionesConReferidor } = await supabaseAdmin
    .from('valoraciones')
    .select(`
      gasto,
      clientes(
        referidor_id,
        agencia_id,
        referidores(id, nombre, stripe_account_id, stripe_onboarded, comision_pct),
        agencias(id, nombre, stripe_account_id, stripe_onboarded)
      )
    `)
    .eq('lugar_id', payload.lugarId)
    .gte('created_at', periodo_desde)
    .lte('created_at', periodo_hasta + 'T23:59:59')
    .not('gasto', 'is', null)

  // Agrupar por referidor/agencia y calcular su parte
  const cuentasMap = {}
  for (const v of (valoracionesConReferidor || [])) {
    const cliente = v.clientes
    if (!cliente) continue

    const ref = cliente.referidores
    const agencia = cliente.agencias
    const importe = v.gasto || 0

    if (ref?.stripe_account_id && ref?.stripe_onboarded) {
      const key = `ref_${ref.id}`
      if (!cuentasMap[key]) cuentasMap[key] = { accountId: ref.stripe_account_id, nombre: ref.nombre, importe: 0 }
      cuentasMap[key].importe += importe
    } else if (agencia?.stripe_account_id && agencia?.stripe_onboarded) {
      const key = `ag_${agencia.id}`
      if (!cuentasMap[key]) cuentasMap[key] = { accountId: agencia.stripe_account_id, nombre: agencia.nombre, importe: 0 }
      cuentasMap[key].importe += importe
    }
  }

  // Calcular transferencias para cada cuenta (proporcional al volumen que generaron)
  const transferencias = Object.values(cuentasMap).map(cuenta => {
    const pct = volumenTotal > 0 ? cuenta.importe / volumenTotal : 0
    const monto = parseFloat((comisionRepartir * pct).toFixed(2))
    return { accountId: cuenta.accountId, nombre: cuenta.nombre, montoCentimos: Math.round(monto * 100) }
  }).filter(t => t.montoCentimos > 0)

  // Crear Checkout Session de Stripe
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: {
          name: `Comisión ${lugar.nombre} — ${periodo_desde} a ${periodo_hasta}`,
          description: `Volumen: €${volumenTotal.toFixed(2)} × ${lugar.porcentaje_plataforma}% = €${comisionTotal.toFixed(2)}`,
        },
        unit_amount: Math.round(comisionTotal * 100), // en céntimos
      },
      quantity: 1,
    }],
    success_url: `${APP_URL}/manager?pago=ok`,
    cancel_url: `${APP_URL}/manager?pago=cancelado`,
    metadata: {
      lugarId: lugar.id,
      managerId: payload.managerId,
      periodoDesde: periodo_desde,
      periodoHasta: periodo_hasta,
      comisionPlataforma: comisionPlataforma.toString(),
      transferencias: JSON.stringify(transferencias),
    },
  })

  return NextResponse.json({
    checkoutUrl: session.url,
    resumen: {
      volumenTotal,
      comisionTotal,
      comisionPlataforma,
      comisionRepartir,
      transferencias,
    }
  })
}

// GET — resumen de comisiones del mes actual para el manager
export async function GET(request) {
  const { payload, response } = requireAuth(request, 'manager')
  if (response) return response

  const { searchParams } = new URL(request.url)
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')

  if (!desde || !hasta) return NextResponse.json({ error: 'Falta período' }, { status: 400 })

  const { data: lugar } = await supabaseAdmin
    .from('lugares')
    .select('porcentaje_plataforma, nombre')
    .eq('id', payload.lugarId)
    .single()

  const { data: valoraciones } = await supabaseAdmin
    .from('valoraciones')
    .select('gasto')
    .eq('lugar_id', payload.lugarId)
    .gte('created_at', desde)
    .lte('created_at', hasta + 'T23:59:59')
    .not('gasto', 'is', null)

  const volumenTotal = (valoraciones || []).reduce((sum, v) => sum + (v.gasto || 0), 0)
  const pctLocal = (lugar?.porcentaje_plataforma || 20) / 100
  const comisionTotal = parseFloat((volumenTotal * pctLocal).toFixed(2))
  const comisionPlataforma = parseFloat((comisionTotal * PLATAFORMA_PCT).toFixed(2))
  const comisionRepartir = parseFloat((comisionTotal - comisionPlataforma).toFixed(2))

  // Liquidaciones ya pagadas en este período
  const { data: liquidacionesPagadas } = await supabaseAdmin
    .from('liquidaciones')
    .select('importe, estado, stripe_payment_intent_id')
    .eq('lugar_id', payload.lugarId)
    .eq('estado', 'pagado')
    .gte('periodo_desde', desde)
    .lte('periodo_hasta', hasta)

  const totalYaPagado = (liquidacionesPagadas || []).reduce((sum, l) => sum + (l.importe || 0), 0)

  return NextResponse.json({
    lugarNombre: lugar?.nombre,
    volumenTotal,
    comisionTotal,
    comisionPlataforma,
    comisionRepartir,
    totalYaPagado,
    pendiente: parseFloat((comisionTotal - totalYaPagado).toFixed(2)),
  })
}
