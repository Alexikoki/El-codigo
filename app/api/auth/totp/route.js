import { NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/auth'
import { supabaseAdmin } from '../../../../lib/supabase'
import { TOTP, Secret } from 'otpauth'
import logger from '../../../../lib/logger'

// GET — Generar setup TOTP (solo si superadmin autenticado)
export async function GET(request) {
  const { payload, response } = requireAuth(request, 'superadmin')
  if (response) return response

  try {
    const { data: config } = await supabaseAdmin
      .from('configuracion')
      .select('valor')
      .eq('clave', 'superadmin_totp_secret')
      .single()

    if (config?.valor) {
      return NextResponse.json({ configured: true })
    }

    const secret = new Secret({ size: 20 })
    const totp = new TOTP({
      issuer: 'El Codigo',
      label: 'Superadmin',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret,
    })

    return NextResponse.json({
      configured: false,
      secret: secret.base32,
      uri: totp.toString(),
    })
  } catch (e) {
    logger.error({ err: e }, 'Error GET /auth/totp')
    return NextResponse.json({ error: 'Error generando TOTP' }, { status: 500 })
  }
}

// POST — Verificar código TOTP (setup o login)
export async function POST(request) {
  try {
    const body = await request.json()
    const { code, secret: newSecret, action } = body

    if (action === 'setup') {
      // Solo superadmin autenticado puede configurar
      const { payload, response } = requireAuth(request, 'superadmin')
      if (response) return response

      if (!code || !newSecret) {
        return NextResponse.json({ error: 'Código y secret requeridos' }, { status: 400 })
      }

      const totp = new TOTP({
        issuer: 'El Codigo',
        label: 'Superadmin',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: Secret.fromBase32(newSecret),
      })

      const delta = totp.validate({ token: code, window: 1 })
      if (delta === null) {
        return NextResponse.json({ error: 'Código incorrecto. Intenta de nuevo.' }, { status: 400 })
      }

      await supabaseAdmin
        .from('configuracion')
        .upsert({ clave: 'superadmin_totp_secret', valor: newSecret, updated_at: new Date().toISOString() })

      return NextResponse.json({ ok: true })
    }

    if (action === 'disable') {
      const { payload, response } = requireAuth(request, 'superadmin')
      if (response) return response

      await supabaseAdmin
        .from('configuracion')
        .delete()
        .eq('clave', 'superadmin_totp_secret')

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (e) {
    logger.error({ err: e }, 'Error POST /auth/totp')
    return NextResponse.json({ error: 'Error procesando TOTP' }, { status: 500 })
  }
}
