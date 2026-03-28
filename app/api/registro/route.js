import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { generarToken } from '../../../lib/jwt'
import { checkRateLimit } from '../../../lib/rateLimitMiddleware'
import { registrarAudit } from '../../../lib/audit'
import { validateBody, registroEmpresaSchema } from '../../../lib/validation'
import { getIP } from '../../../lib/rateLimit'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  const rl = await checkRateLimit(request, { limite: 3, ventanaMs: 3600000 })
  if (rl) return rl

  const body = await request.json()
  const { data: validated, response: valErr } = validateBody(body, registroEmpresaSchema)
  if (valErr) return valErr
  const { nombre, email, password, tipo } = validated
  const ip = getIP(request)

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
