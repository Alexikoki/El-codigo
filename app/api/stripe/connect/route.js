import { NextResponse } from 'next/server'
import { stripe } from '../../../../lib/stripe'
import { supabaseAdmin } from '../../../../lib/supabase'
import { requireAuth } from '../../../../lib/auth'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://itrustb2b.com'

// POST — crea o recupera la cuenta Connect Express y devuelve el link de onboarding
export async function POST(request) {
  const { payload, response } = requireAuth(request, ['agencia', 'referidor'])
  if (response) return response

  const esAgencia = payload.rol === 'agencia'
  const tabla = esAgencia ? 'agencias' : 'referidores'
  const id = esAgencia ? payload.agenciaId : payload.referidorId

  // Obtener datos del usuario
  const { data: usuario } = await supabaseAdmin.from(tabla).select('*').eq('id', id).single()
  if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  let accountId = usuario.stripe_account_id

  // Si no tiene cuenta Stripe aún, crearla
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'ES',
      email: usuario.email,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: { tabla, id },
    })
    accountId = account.id

    await supabaseAdmin.from(tabla).update({ stripe_account_id: accountId }).eq('id', id)
  }

  // Generar link de onboarding
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${APP_URL}/${esAgencia ? 'agencia' : 'referidor'}?stripe=refresh`,
    return_url: `${APP_URL}/${esAgencia ? 'agencia' : 'referidor'}?stripe=success`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: accountLink.url })
}

// GET — comprueba el estado de la cuenta Connect del usuario
export async function GET(request) {
  const { payload, response } = requireAuth(request, ['agencia', 'referidor'])
  if (response) return response

  const esAgencia = payload.rol === 'agencia'
  const tabla = esAgencia ? 'agencias' : 'referidores'
  const id = esAgencia ? payload.agenciaId : payload.referidorId

  const { data: usuario } = await supabaseAdmin.from(tabla).select('stripe_account_id, stripe_onboarded').eq('id', id).single()
  if (!usuario) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  // Si tiene account_id, verificar estado real en Stripe
  if (usuario.stripe_account_id && !usuario.stripe_onboarded) {
    const account = await stripe.accounts.retrieve(usuario.stripe_account_id)
    const onboarded = account.details_submitted && account.charges_enabled

    if (onboarded) {
      await supabaseAdmin.from(tabla).update({ stripe_onboarded: true }).eq('id', id)
    }

    return NextResponse.json({ onboarded, accountId: usuario.stripe_account_id })
  }

  return NextResponse.json({ onboarded: usuario.stripe_onboarded || false, accountId: usuario.stripe_account_id || null })
}
