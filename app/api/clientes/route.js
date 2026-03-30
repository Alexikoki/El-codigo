import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { rateLimit, getIP } from '../../../lib/rateLimit'
import { generarCodigoConfirmacion } from '../../../lib/qr'
import { enviarCodigoConfirmacion } from '../../../lib/email'
import logger from '../../../lib/logger'

export async function POST(request) {
  const ip = getIP(request)
  const { bloqueado } = await rateLimit(ip, 20, 60000)
  if (bloqueado) {
    return NextResponse.json({ error: 'Demasiados intentos' }, { status: 429 })
  }

  try {
    const { nombre, email, numPersonas, qrToken, lugarId, cfToken } = await request.json()

    if (!nombre || !email || !qrToken || !lugarId || !cfToken) {
      return NextResponse.json({ error: 'Faltan datos requeridos o fallo validando CAPTCHA.' }, { status: 400 })
    }

    // Validación lado servidor del Turnstile de Cloudflare
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${cfToken}`
    })

    const verifyJson = await verifyRes.json()
    if (!verifyJson.success) {
      return NextResponse.json({ error: 'Fallo de seguridad Anti-Bot. Recarga la página.' }, { status: 403 })
    }

    const { data: referidor, error: refError } = await supabaseAdmin
      .from('referidores')
      .select('id')
      .eq('qr_token', qrToken)
      .eq('activo', true)
      .single()

    if (refError || !referidor) {
      return NextResponse.json({ error: 'QR Inválido o Referidor inactivo.' }, { status: 404 })
    }

    if (!referidor) {
      return NextResponse.json({ error: 'QR no válido' }, { status: 404 })
    }

    const codigo = generarCodigoConfirmacion()
    const expira = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const { data: cliente, error } = await supabaseAdmin
      .from('clientes')
      .insert({
        referidor_id: referidor.id,
        lugar_id: lugarId,
        nombre,
        email,
        num_personas: numPersonas || 1,
        codigo_confirmacion: codigo,
        codigo_expira_at: expira
      })
      .select()
      .single()

    if (error) {
      logger.error({ err: error }, 'Error DB Cliente:')
      return NextResponse.json({ error: 'Error interno guardando tu registro.' }, { status: 500 })
    }

    try {
      await enviarCodigoConfirmacion({ nombre, email, codigo })
    } catch (emailError) {
      logger.error({ err: emailError }, 'Error Resend:')
      // No bloqueamos el registro si el email falla, pero lo logueamos.
    }

    return NextResponse.json({ ok: true, clienteId: cliente.id }, { status: 201 })
  } catch (globalError) {
    logger.error({ err: globalError }, 'Crash Crítico API /clientes:')
    return NextResponse.json({ error: 'Fallo de conectividad remoto.' }, { status: 500 })
  }
}
