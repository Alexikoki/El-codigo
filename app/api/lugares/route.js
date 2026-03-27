import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { requireAuth } from '../../../lib/auth'
import { verificarToken, extraerTokenDeCookie } from '../../../lib/jwt'
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
  const { response } = requireAuth(request, 'superadmin')
  if (response) return response

  const { nombre, tipo, descripcion, direccion, barrio, descuento, porcentaje_plataforma,
          manager_nombre, manager_email, manager_password } = await request.json()

  if (!nombre || !tipo) {
    return NextResponse.json({ error: 'Faltan nombre y tipo' }, { status: 400 })
  }
  if (!manager_nombre || !manager_email || !manager_password) {
    return NextResponse.json({ error: 'Faltan datos del manager (nombre, email y contraseña)' }, { status: 400 })
  }
  if (manager_password.length < 6) {
    return NextResponse.json({ error: 'La contraseña del manager debe tener al menos 6 caracteres' }, { status: 400 })
  }

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
  const { response } = requireAuth(request, 'superadmin')
  if (response) return response

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

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
  const { response } = requireAuth(request, 'superadmin')
  if (response) return response

  const { id, nombre, descuento, porcentaje_plataforma, activo, barrio } = await request.json()
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

  const update = {}
  if (nombre !== undefined) update.nombre = nombre
  if (descuento !== undefined) update.descuento = parseInt(descuento)
  if (porcentaje_plataforma !== undefined) update.porcentaje_plataforma = parseFloat(porcentaje_plataforma)
  if (activo !== undefined) update.activo = activo
  if (barrio !== undefined) update.barrio = barrio

  await supabaseAdmin.from('lugares').update(update).eq('id', id)
  return NextResponse.json({ ok: true })
}
