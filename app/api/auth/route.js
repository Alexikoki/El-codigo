import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { generarToken } from '../../../lib/jwt'
import { validateBody, loginSchema } from '../../../lib/validation'
import { rateLimit, getIP } from '../../../lib/rateLimit'
import logger from '../../../lib/logger'
import bcrypt from 'bcryptjs'

// === HELPER: construir respuesta con cookie httpOnly ===
function respuestaConCookie(body, token, rememberMe = false) {
  const response = NextResponse.json(body)
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 8,
    path: '/'
  })
  return response
}

async function limpiarRateLimit(ip) {
  await supabaseAdmin.from('rate_limits').delete().eq('key', `rl:${ip}:login`).catch(() => {})
}

export async function POST(request) {
  try {
    const ip = getIP(request)

    // Rate limit persistente: 5 intentos / 15 min
    const { bloqueado } = await rateLimit(`${ip}:login`, 5, 15 * 60 * 1000)
    if (bloqueado) {
      return NextResponse.json(
        { error: 'Demasiados intentos fallidos. Espera 15 minutos.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { data: validated, response: valErr } = validateBody(body, loginSchema)
    if (valErr) return valErr
    const { email, password, cfToken, rememberMe } = validated

    // Verificación Cloudflare Turnstile
    // Si viene totpCode, es el segundo POST del flujo 2FA — skip Turnstile
    const is2FAStep = !!body.totpCode
    let isHuman = is2FAStep
    if (!isHuman) {
      const testKey = request.headers.get('x-test-key')
      if (process.env.TEST_API_KEY && testKey === process.env.TEST_API_KEY) {
        isHuman = true
      } else if (process.env.NODE_ENV === 'development' && cfToken?.startsWith('1x0000000000000000000000000000000AA')) {
        isHuman = true
      } else if (cfToken) {
        const cfFormData = new FormData()
        cfFormData.append('secret', process.env.TURNSTILE_SECRET_KEY)
        cfFormData.append('response', cfToken)
        const cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST', body: cfFormData
        })
        const cfResult = await cfRes.json()
        if (cfResult.success) isHuman = true
      }
    }

    if (!isHuman) {
      return NextResponse.json({ error: 'El sistema anti-bots ha bloqueado la petición. Recarga la página.' }, { status: 403 })
    }

    // === DETECCIÓN AUTOMÁTICA DE ROL ===
    // 1. Superadmin (email + password de env vars)
    const saEmail = (process.env.SUPERADMIN_EMAIL || '').trim()
    const saPass = (process.env.SUPERADMIN_PASSWORD || '').trim()
    const inputEmail = email.trim()
    const inputPass = password.trim()

    if (saEmail && inputEmail === saEmail && inputPass === saPass) {
      // Check 2FA
      const { data: totpConfig } = await supabaseAdmin
        .from('configuracion')
        .select('valor')
        .eq('clave', 'superadmin_totp_secret')
        .single()

      if (totpConfig?.valor) {
        const { TOTP, Secret } = await import('otpauth')

        if (!body.totpCode) {
          return NextResponse.json({ requires2FA: true })
        }

        const totp = new TOTP({
          issuer: 'El Codigo', label: 'Superadmin',
          algorithm: 'SHA1', digits: 6, period: 30,
          secret: Secret.fromBase32(totpConfig.valor),
        })
        if (totp.validate({ token: body.totpCode, window: 1 }) === null) {
          return NextResponse.json({ error: 'Código 2FA incorrecto' }, { status: 401 })
        }
      }

      const token = generarToken({ rol: 'superadmin' })
      await limpiarRateLimit(ip)
      return respuestaConCookie({ rol: 'superadmin' }, token, rememberMe)
    }

    // 2. Manager
    const { data: manager } = await supabaseAdmin
      .from('managers_locales').select('*, lugares(nombre)').eq('email', email).eq('activo', true).single()
    if (manager) {
      const ok = await bcrypt.compare(password, manager.password_hash)
      if (ok) {
        const token = generarToken({ rol: 'manager', managerId: manager.id, lugarId: manager.lugar_id, nombre: manager.nombre })
        await limpiarRateLimit(ip)
        return respuestaConCookie(
          { rol: 'manager', manager: { id: manager.id, nombre: manager.nombre, lugarNombre: manager.lugares?.nombre || 'Sin Asignar', lugarId: manager.lugar_id } },
          token, rememberMe
        )
      }
    }

    // 3. Referidor
    const { data: referidor } = await supabaseAdmin
      .from('referidores').select('*').eq('email', email).eq('activo', true).single()
    if (referidor) {
      const ok = await bcrypt.compare(password, referidor.password_hash)
      if (ok) {
        const token = generarToken({ rol: 'referidor', referidorId: referidor.id, nombre: referidor.nombre })
        await limpiarRateLimit(ip)
        return respuestaConCookie(
          { rol: 'referidor', referidor: { id: referidor.id, nombre: referidor.nombre, email: referidor.email, qr_token: referidor.qr_token } },
          token, rememberMe
        )
      }
    }

    // 4. Agencia
    const { data: agencia } = await supabaseAdmin
      .from('agencias').select('*').eq('email', email).eq('activo', true).single()
    if (agencia) {
      const ok = await bcrypt.compare(password, agencia.password_hash)
      if (ok) {
        const token = generarToken({ rol: 'agencia', agenciaId: agencia.id, nombre: agencia.nombre })
        await limpiarRateLimit(ip)
        return respuestaConCookie(
          { rol: 'agencia', agencia: { id: agencia.id, nombre: agencia.nombre, email: agencia.email } },
          token, rememberMe
        )
      }
    }

    // 5. Staff (último porque es el más común)
    const { data: staff } = await supabaseAdmin
      .from('staff').select('*, lugares(nombre)').eq('email', email).eq('activo', true).single()
    if (staff) {
      const ok = await bcrypt.compare(password, staff.password_hash)
      if (ok) {
        const token = generarToken({ rol: 'staff', staffId: staff.id, lugarId: staff.lugar_id, nombre: staff.nombre })
        await limpiarRateLimit(ip)
        return respuestaConCookie(
          { rol: 'staff', staff: { id: staff.id, nombre: staff.nombre, lugarNombre: staff.lugares?.nombre || 'Sin Asignar' } },
          token, rememberMe
        )
      }
    }

    // No encontrado en ninguna tabla
    logger.warn({ inputEmail, saEmailSet: !!saEmail, saPassSet: !!saPass }, 'Login fallido — sin match en ninguna tabla')
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })

  } catch (globalError) {
    logger.error({ err: globalError }, 'Crash API /auth')
    return NextResponse.json({ error: 'Servicio de autenticación temporalmente no disponible.' }, { status: 500 })
  }
}
