import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { generarToken } from '../../../lib/jwt'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    const { email, password, tipo, cfToken } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Faltan credenciales' }, { status: 400 })
    }

    if (!cfToken || cfToken === '') {
      return NextResponse.json({ error: 'Falta token de seguridad (Turnstile)' }, { status: 400 })
    }

    // Bypass Local: Si usamos la Dummy Key 1x00... el token de retorno dummy simula éxito.
    // Cloudflare retorna siempre tokens con formato específico de test para localhost.
    let isHuman = false;

    if (cfToken.startsWith('1x0000000000000000000000000000000AA')) {
      isHuman = true; // Simulación exitosa local
    } else {
      // Validación real contra Servidores de Producción (Vercel)
      const cfFormData = new FormData();
      cfFormData.append('secret', process.env.TURNSTILE_SECRET_KEY);
      cfFormData.append('response', cfToken);

      const cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: cfFormData
      })
      const cfResult = await cfRes.json()

      if (cfResult.success) {
        isHuman = true;
      }
    }

    if (!isHuman) {
      return NextResponse.json({ error: 'El sistema anti-bots ha bloqueado la petición. Recarga la página.' }, { status: 403 })
    }

    // Superadmin
    if (tipo === 'superadmin') {
      if (password === process.env.SUPERADMIN_PASSWORD) {
        const token = generarToken({ rol: 'superadmin' })
        return NextResponse.json({ token, rol: 'superadmin' })
      }
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    }

    // Referidor
    if (tipo === 'referidor') {
      const { data: referidor } = await supabaseAdmin
        .from('referidores')
        .select('*')
        .eq('email', email)
        .eq('activo', true)
        .single()

      if (!referidor) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
      const ok = await bcrypt.compare(password, referidor.password_hash)
      if (!ok) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })

      const token = generarToken({ rol: 'referidor', referidorId: referidor.id, nombre: referidor.nombre })
      return NextResponse.json({
        token,
        rol: 'referidor',
        referidor: {
          id: referidor.id,
          nombre: referidor.nombre,
          email: referidor.email,
          qr_token: referidor.qr_token
        }
      })
    }

    // Agencia (B2B Tour Operator)
    if (tipo === 'agencia') {
      const { data: agencia } = await supabaseAdmin
        .from('agencias')
        .select('*')
        .eq('email', email)
        .eq('activo', true)
        .single()

      if (!agencia) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
      const ok = await bcrypt.compare(password, agencia.password_hash)
      if (!ok) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })

      const token = generarToken({ rol: 'agencia', agenciaId: agencia.id, nombre: agencia.nombre })
      return NextResponse.json({
        token,
        rol: 'agencia',
        agencia: {
          id: agencia.id,
          nombre: agencia.nombre,
          email: agencia.email
        }
      })
    }

    // Manager (Dueño de Local B2B)
    if (tipo === 'manager') {
      const { data: manager } = await supabaseAdmin
        .from('managers_locales')
        .select('*, lugares(nombre)')
        .eq('email', email)
        .eq('activo', true)
        .single()

      if (!manager) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
      const ok = await bcrypt.compare(password, manager.password_hash)
      if (!ok) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })

      const token = generarToken({ rol: 'manager', managerId: manager.id, lugarId: manager.lugar_id, nombre: manager.nombre })
      return NextResponse.json({
        token,
        rol: 'manager',
        manager: {
          id: manager.id,
          nombre: manager.nombre,
          lugarNombre: manager.lugares ? manager.lugares.nombre : 'Sin Asignar'
        }
      })
    }

    // Staff
    const { data: staff } = await supabaseAdmin
      .from('staff')
      .select('*, lugares(nombre)')
      .eq('email', email)
      .eq('activo', true)
      .single()

    if (!staff) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    const ok = await bcrypt.compare(password, staff.password_hash)
    if (!ok) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })

    const token = generarToken({ rol: 'staff', staffId: staff.id, lugarId: staff.lugar_id, nombre: staff.nombre })
    return NextResponse.json({ token, rol: 'staff', staff: { id: staff.id, nombre: staff.nombre, lugarNombre: staff.lugares.nombre } })
  } catch (globalError) {
    console.error('Crash API /auth:', globalError)
    return NextResponse.json({ error: 'Servicio de autenticación temporalmente no disponible.' }, { status: 500 })
  }
}