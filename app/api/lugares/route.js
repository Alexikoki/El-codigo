import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireAuth } from '../../../lib/auth'
import { verificarToken, extraerTokenDeCookie } from '../../../lib/jwt'
import { checkRateLimit } from '../../../lib/rateLimitMiddleware'
import { validateBody, lugarSchema, lugarUpdateSchema, idSchema } from '../../../lib/validation'
import bcrypt from 'bcryptjs'

export async function GET(request) {
  // GET es semi-público: superadmin ve todo, el resto ve solo activos
  const payload = verificarToken(extraerTokenDeCookie(request))

  if (payload?.rol === 'superadmin') {
    const { data: lugares } = await supabaseAdmin
      .from('lugares')
      .select('*, managers_locales(id, nombre, email, activo)')
      .order('nombre')

    return NextResponse.json({ lugares: lugares || [] })
  }

  const { data: lugares } = await supabaseAdmin
    .from('lugares')
    .select('id, nombre, tipo, barrio, descuento')
    .eq('activo', true)
    .order('nombre')

  return NextResponse.json({ lugares: lugares || [] })
}

export async function POST(request) {
  const rl = await checkRateLimit(request, { limite: 10, ventanaMs: 60000 })
  if (rl) return rl
  const { response } = requireAuth(request, 'superadmin')
  if (response) return response

  const body = await request.json()
  const { data: validated, response: valErr } = validateBody(body, lugarSchema)
  if (valErr) return valErr

  const { nombre, tipo, direccion, barrio, descuento, porcentaje_plataforma,
          manager_nombre, manager_email, manager_password } = validated
  const descripcion = body.descripcion || ''

  const { data: emailExistente } = await supabaseAdmin
    .from('managers_locales').select('id').eq('email', manager_email).single()
  if (emailExistente) {
    return NextResponse.json({ error: 'Ese email de manager ya está registrado' }, { status: 409 })
  }

  const { data: lugar, error: errorLugar } = await supabaseAdmin
    .from('lugares')
    .insert({
      nombre, tipo, descripcion, direccion,
      barrio: barrio || '',
      descuento: descuento ?? 10,
      porcentaje_plataforma: porcentaje_plataforma ?? 20
    })
    .select()
    .single()

  if (errorLugar) return NextResponse.json({ error: 'Error al crear el local' }, { status: 500 })

  const password_hash = await bcrypt.hash(manager_password, 12)
  const { error: errorManager } = await supabaseAdmin
    .from('managers_locales')
    .insert({ nombre: manager_nombre, email: manager_email, password_hash, lugar_id: lugar.id, activo: true })

  if (errorManager) {
    await supabaseAdmin.from('lugares').delete().eq('id', lugar.id)
    return NextResponse.json({ error: 'Error al crear el manager' }, { status: 500 })
  }

  return NextResponse.json({ lugar }, { status: 201 })
}

export async function DELETE(request) {
  const rl = await checkRateLimit(request, { limite: 5, ventanaMs: 60000 })
  if (rl) return rl
  const { response } = requireAuth(request, 'superadmin')
  if (response) return response

  const body = await request.json()
  const result = idSchema.safeParse(body.id)
  if (!result.success) return NextResponse.json({ error: 'ID no válido' }, { status: 400 })
  const id = result.data

  const { data: clientesLocal } = await supabaseAdmin.from('clientes').select('id').eq('lugar_id', id)
  const clienteIds = (clientesLocal || []).map(c => c.id)

  await Promise.all([
    clienteIds.length > 0 ? supabaseAdmin.from('liquidaciones').delete().in('cliente_id', clienteIds) : null,
    supabaseAdmin.from('valoraciones').delete().eq('lugar_id', id)
  ])
  await Promise.all([
    supabaseAdmin.from('clientes').delete().eq('lugar_id', id),
    supabaseAdmin.from('staff').delete().eq('lugar_id', id),
    supabaseAdmin.from('managers_locales').delete().eq('lugar_id', id)
  ])
  const { error } = await supabaseAdmin.from('lugares').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function PATCH(request) {
  const rl = await checkRateLimit(request, { limite: 20, ventanaMs: 60000 })
  if (rl) return rl
  const { response } = requireAuth(request, 'superadmin')
  if (response) return response

  const body = await request.json()
  const { data: validated, response: valErr } = validateBody(body, lugarUpdateSchema)
  if (valErr) return valErr

  const { id, ...fields } = validated
  const update = {}
  if (fields.nombre !== undefined) update.nombre = fields.nombre
  if (fields.descuento !== undefined) update.descuento = fields.descuento
  if (fields.porcentaje_plataforma !== undefined) update.porcentaje_plataforma = fields.porcentaje_plataforma
  if (fields.activo !== undefined) update.activo = fields.activo
  if (fields.barrio !== undefined) update.barrio = fields.barrio

  await supabaseAdmin.from('lugares').update(update).eq('id', id)
  return NextResponse.json({ ok: true })
}
