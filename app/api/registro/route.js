import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { generarToken } from '../../../lib/jwt'
import { rateLimit, getIP } from '../../../lib/rateLimit'
import { registrarAudit } from '../../../lib/audit'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  const ip = getIP(request)

  // Rate limiting: max 3 registros por hora
  const { bloqueado } = rateLimit(ip, 3, 3600000)
  if (bloqueado) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera 1 hora.' },
      { status: 429 }
    )
  }

  const { nombre, email, password, tipo } = await request.json()

  if (!nombre || !email || !password || !tipo) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  // Verificar email no existe
  const { data: existe } = await supabaseAdmin
    .from('empresas')
    .select('id')
    .eq('email', email)
    .single()

  if (existe) {
    return NextResponse.json({ error: 'Email ya registrado' }, { status: 400 })
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 12)

  // Crear empresa
  const { data: empresa, error } = await supabaseAdmin
    .from('empresas')
    .insert({ nombre, email, password_hash, tipo })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Error al crear empresa' }, { status: 500 })
  }

  const token = generarToken({ rol: 'empresa', empresaId: empresa.id })

  await registrarAudit({
    tabla: 'empresas',
    accion: 'registro',
    registroId: empresa.id,
    empresaId: empresa.id,
    ip
  })

  return NextResponse.json({ token, empresa }, { status: 201 })
}
