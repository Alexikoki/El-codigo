import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { generarToken } from '../../../lib/jwt'
import { rateLimit, getIP } from '../../../lib/rateLimit'
import { registrarAudit } from '../../../lib/audit'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  const ip = getIP(request)

  // Rate limiting: max 5 intentos por minuto
  const { bloqueado } = rateLimit(ip, 5, 60000)
  if (bloqueado) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera 1 minuto.' },
      { status: 429 }
    )
  }

  const { email, password, tipo } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  // Login admin
  if (tipo === 'admin' && email === 'admin') {
    const valido = password === process.env.ADMIN_PASSWORD
    if (!valido) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    const token = generarToken({ rol: 'admin' })
    return NextResponse.json({ token, rol: 'admin' })
  }

  // Login superadmin
  if (tipo === 'superadmin' && email === 'superadmin') {
    const valido = password === process.env.SUPERADMIN_PASSWORD
    if (!valido) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    const token = generarToken({ rol: 'superadmin' })
    return NextResponse.json({ token, rol: 'superadmin' })
  }

  // Login empresa
  const { data: empresa } = await supabaseAdmin
    .from('empresas')
    .select('*')
    .eq('email', email)
    .eq('activo', true)
    .single()

  if (empresa) {
    const valido = await bcrypt.compare(password, empresa.password_hash)
    if (!valido) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    const token = generarToken({ rol: 'empresa', empresaId: empresa.id })
    await registrarAudit({ tabla: 'empresas', accion: 'login', registroId: empresa.id, empresaId: empresa.id, ip })
    return NextResponse.json({ token, rol: 'empresa', empresa })
  }

  // Login camarero
  const { data: camarero } = await supabaseAdmin
    .from('camareros')
    .select('*')
    .eq('email', email)
    .eq('activo', true)
    .single()

  if (camarero) {
    const valido = await bcrypt.compare(password, camarero.password_hash)
    if (!valido) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    const token = generarToken({ rol: 'camarero', camareroId: camarero.id, empresaId: camarero.empresa_id })
    return NextResponse.json({ token, rol: 'camarero', camarero })
  }

  return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
}