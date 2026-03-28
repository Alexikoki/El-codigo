import { NextResponse } from 'next/server'
import { stripe } from '../../../../lib/stripe'
import { supabaseAdmin } from '../../../../lib/supabase'

export const config = { api: { bodyParser: false } }

export async function POST(request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const meta = session.metadata

    if (!meta?.lugarId) return NextResponse.json({ ok: true })

    // Idempotencia: verificar si ya se procesó este pago
    const { data: existing } = await supabaseAdmin
      .from('liquidaciones')
      .select('id')
      .eq('stripe_payment_intent_id', session.payment_intent)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ ok: true, already_processed: true })
    }

    const comisionTotal = session.amount_total / 100 // de céntimos a euros
    const comisionPlataforma = parseFloat(meta.comisionPlataforma || 0)
    const transferencias = JSON.parse(meta.transferencias || '[]')

    // 1. Guardar liquidación en DB
    await supabaseAdmin.from('liquidaciones').insert({
      lugar_id: meta.lugarId,
      importe: comisionTotal,
      comision_plataforma: comisionPlataforma,
      periodo_desde: meta.periodoDesde,
      periodo_hasta: meta.periodoHasta,
      estado: 'pagado',
      pagado_at: new Date().toISOString(),
      stripe_payment_intent_id: session.payment_intent,
    })

    // 2. Hacer transferencias a cada cuenta Connect (agencia/referidor)
    for (const t of transferencias) {
      try {
        await stripe.transfers.create({
          amount: t.montoCentimos,
          currency: 'eur',
          destination: t.accountId,
          transfer_group: session.payment_intent,
          description: `Comisión ${meta.periodoDesde} → ${meta.periodoHasta}`,
        })
      } catch (err) {
        console.error(`Transfer a ${t.accountId} fallida:`, err.message)
        // No bloqueamos el webhook por un fallo de transferencia individual
      }
    }
  }

  // Cuando una cuenta Connect completa el onboarding
  if (event.type === 'account.updated') {
    const account = event.data.object
    if (account.details_submitted && account.charges_enabled) {
      const meta = account.metadata || {}
      const TABLAS_PERMITIDAS = ['referidores', 'agencias', 'managers_locales']
      if (meta.tabla && meta.id && TABLAS_PERMITIDAS.includes(meta.tabla)) {
        // Idempotencia: verificar si ya está marcado como onboarded
        const { data: record } = await supabaseAdmin
          .from(meta.tabla)
          .select('stripe_onboarded')
          .eq('id', meta.id)
          .maybeSingle()

        if (record?.stripe_onboarded) {
          return NextResponse.json({ ok: true, already_processed: true })
        }

        await supabaseAdmin
          .from(meta.tabla)
          .update({ stripe_onboarded: true })
          .eq('id', meta.id)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
