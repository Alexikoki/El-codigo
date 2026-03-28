import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { generarToken } from '../../../lib/jwt'
import { validateBody, loginSchema } from '../../../lib/validation'
import { rateLimit, getIP } from '../../../lib/rateLimit'
import logger from '../../../lib/logger'
import bcrypt from 'bcryptjs'

// === HELPER: construir respuesta con cookie httpOnly ===
function respuestaConCookie(payload, cookieOpts = {}) {
  const { body, status = 200, token } = cookieOpts
  const response = NextResponse.json(body, { status })
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 8,
    path: '/'
  })
  return response
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
    const { email, password, tipo, cfToken } = validated

    // Verificación Cloudflare Turnstile
    let isHuman = false
    const testKey = request.headers.get('x-test-key')
    if (process.env.TEST_API_KEY && testKey === process.env.TEST_API_KEY) {
      isHuman = true
    } else if (process.env.NODE_ENV === 'development' && cfToken.startsWith('1x0000000000000000000000000000000AA')) {
      isHuman = true
    } else {
      const cfFormData = new FormData()
      cfFormData.append('secret', process.env.TURNSTILE_SECRET_KEY)
      cfFormData.append('response', cfToken)
      const cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST', body: cfFormData
      })
      const cfResult = await cfRes.json()
      if (cfResult.success) isHuman = true
    }

    if (!isHuman) {
      return NextResponse.json({ error: 'El sistema anti-bots ha bloqueado la petición. Recarga la página.' }, { status: 403 })
    }

    // === SUPERADMIN ===
    if (tipo === 'superadmin') {
      if (password === process.env.SUPERADMIN_PASSWORD) {
        // Check si 2FA está configurado
        const { data: totpConfig } = await supabaseAdmin
          .from('configuracion')
          .select('valor')
          .eq('clave', 'superadmin_totp_secret')
          .single()

        if (totpConfig?.valor) {
          const { TOTP, Secret } = await import('otpauth')

          if (!body.totpCode) {
            // Password correcta pero falta código 2FA
            return NextResponse.json({ requires2FA: true })
          }

          const totp = new TOTP({
            issuer: 'El Codigo', label: 'Superadmin',
            algorithm: 'SHA1', digits: 6, period: 30,
            secret: Secret.fromBase32(totpConfig.valor),
          })
          const delta = totp.validate({ token: body.totpCode, window: 1 })
          if (delta === null) {
            return NextResponse.json({ error: 'Código 2FA incorrecto' }, { status: 401 })
          }
        }

        const token = generarToken({ rol: 'superadmin' })
        await supabaseAdmin.from('rate_limits').delete().eq('key', `rl:${ip}:login`)
        return respuestaConCookie({ rol: 'superadmin' }, { body: { rol: 'superadmin' }, token })
      }
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    }

    // === REFERIDOR ===
    if (tipo === 'referidor') {
      const { data: referidor } = await supabaseAdmin
        .from('referidores').select('*').eq('email', email).eq('activo', true).single()
      if (!referidor) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
      const ok = await bcrypt.compare(password, referidor.password_hash)
      if (!ok) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })

      const token = generarToken({ rol: 'referidor', referidorId: referidor.id, nombre: referidor.nombre })
      await supabaseAdmin.from('rate_limits').delete().eq('key', `rl:${ip}:login`)
      return respuestaConCookie(
        { rol: 'referidor', referidor: { id: referidor.id, nombre: referidor.nombre, email: referidor.email, qr_token: referidor.qr_token } },
        { body: { rol: 'referidor', referidor: { id: referidor.id, nombre: referidor.nombre, email: referidor.email, qr_token: referidor.qr_token } }, token }
      )
    }

    // === AGENCIA ===
    if (tipo === 'agencia') {
      const { data: agencia } = await supabaseAdmin
        .from('agencias').select('*').eq('email', email).eq('activo', true).single()
      if (!agencia) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
      const ok = await bcrypt.compare(password, agencia.password_hash)
      if (!ok) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })

      const token = generarToken({ rol: 'agencia', agenciaId: agencia.id, nombre: agencia.nombre })
      await supabaseAdmin.from('rate_limits').delete().eq('key', `rl:${ip}:login`)
      return respuestaConCookie(
        { rol: 'agencia', agencia: { id: agencia.id, nombre: agencia.nombre, email: agencia.email } },
        { body: { rol: 'agencia', agencia: { id: agencia.id, nombre: agencia.nombre, email: agencia.email } }, token }
      )
    }

    // === MANAGER ===
    if (tipo === 'manager') {
      const { data: manager } = await supabaseAdmin
        .from('managers_locales').select('*, lugares(nombre)').eq('email', email).eq('activo', true).single()
      if (!manager) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
      const ok = await bcrypt.compare(password, manager.password_hash)
      if (!ok) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })

      const token = generarToken({ rol: 'manager', managerId: manager.id, lugarId: manager.lugar_id, nombre: manager.nombre })
      await supabaseAdmin.from('rate_limits').delete().eq('key', `rl:${ip}:login`)
      return respuestaConCookie(
        { rol: 'manager', manager: { id: manager.id, nombre: manager.nombre, lugarNombre: manager.lugares?.nombre || 'Sin Asignar', lugarId: manager.lugar_id } },
        { body: { rol: 'manager', manager: { id: manager.id, nombre: manager.nombre, lugarNombre: manager.lugares?.nombre || 'Sin Asignar', lugarId: manager.lugar_id } }, token }
      )
    }

    // === STAFF ===
    const { data: staff } = await supabaseAdmin
      .from('staff').select('*, lugares(nombre)').eq('email', email).eq('activo', true).single()
    if (!staff) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    const ok = await bcrypt.compare(password, staff.password_hash)
    if (!ok) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })

    const token = generarToken({ rol: 'staff', staffId: staff.id, lugarId: staff.lugar_id, nombre: staff.nombre })
    await supabaseAdmin.from('rate_limits').delete().eq('key', `rl:${ip}:login`)
    return respuestaConCookie(
      { rol: 'staff', staff: { id: staff.id, nombre: staff.nombre, lugarNombre: staff.lugares?.nombre || 'Sin Asignar' } },
      { body: { rol: 'staff', staff: { id: staff.id, nombre: staff.nombre, lugarNombre: staff.lugares?.nombre || 'Sin Asignar' } }, token }
    )

  } catch (globalError) {
    logger.error({ err: globalError }, 'Crash API /auth')
    return NextResponse.json({ error: 'Servicio de autenticación temporalmente no disponible.' }, { status: 500 })
  }
}
