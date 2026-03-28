import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { generarToken } from '../../../lib/jwt'
import { validateBody, loginSchema } from '../../../lib/validation'
import bcrypt from 'bcryptjs'

// === RATE LIMITER (en memoria, por IP) ===
// Protege contra ataques de fuerza bruta al login.
const loginAttempts = new Map() // Map<ip, { count, firstAttempt }>
const RATE_LIMIT_MAX = 5        // max intentos
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // bloqueo 15 minutos

function checkRateLimit(ip) {
  const now = Date.now()
  const record = loginAttempts.get(ip)

  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now })
    return true // OK
  }

  if (record.count >= RATE_LIMIT_MAX) return false // Bloqueado

  record.count++
  return true // OK
}

function clearRateLimit(ip) {
  loginAttempts.delete(ip) // Login correcto, resetear su contador
}

// === HELPER: construir respuesta con cookie httpOnly ===
function respuestaConCookie(payload, cookieOpts = {}) {
  const { body, status = 200, token } = cookieOpts
  const response = NextResponse.json(body, { status })
  response.cookies.set('auth_token', token, {
    httpOnly: true,                       // JS del navegador NO puede leerla
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
    sameSite: 'strict',                   // Protección CSRF
    maxAge: 60 * 60 * 8,                  // 8 horas (igual que el JWT)
    path: '/'
  })
  return response
}

export async function POST(request) {
  try {
    // Extraer IP real (Vercel pasa la IP en x-forwarded-for)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    if (!checkRateLimit(ip)) {
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
      isHuman = true // Bypass para tests E2E con clave de entorno
    } else if (process.env.NODE_ENV === 'development' && cfToken.startsWith('1x0000000000000000000000000000000AA')) {
      isHuman = true // Bypass solo para test local en desarrollo
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
        const token = generarToken({ rol: 'superadmin' })
        clearRateLimit(ip)
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
      clearRateLimit(ip)
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
      clearRateLimit(ip)
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
      clearRateLimit(ip)
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
    clearRateLimit(ip)
    return respuestaConCookie(
      { rol: 'staff', staff: { id: staff.id, nombre: staff.nombre, lugarNombre: staff.lugares?.nombre || 'Sin Asignar' } },
      { body: { rol: 'staff', staff: { id: staff.id, nombre: staff.nombre, lugarNombre: staff.lugares?.nombre || 'Sin Asignar' } }, token }
    )

  } catch (globalError) {
    console.error('Crash API /auth:', globalError)
    return NextResponse.json({ error: 'Servicio de autenticación temporalmente no disponible.' }, { status: 500 })
  }
}
