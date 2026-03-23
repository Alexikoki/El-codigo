import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { verificarToken, extraerTokenDeCookie } from '../../../lib/jwt'
import bcrypt from 'bcryptjs'

export async function GET(request) {
  const payload = verificarToken(extraerTokenDeCookie(request))

  // Superadmin recibe todos los campos + manager asociado; público solo id, nombre, tipo
  if (payload?.rol === 'superadmin') {
    const { data: lugares } = await supabaseAdmin
      .from('lugares')
      .select('*, managers_locales(id, nombre, email, activo)')
      .order('nombre')

    return NextResponse.json({ lugares: lugares || [] })
  }

  const { data: lugares } = await supabaseAdmin
    .from('lugares')
    .select('id, nombre, tipo')
    .eq('activo', true)
    .order('nombre')

  return NextResponse.json({ lugares: lugares || [] })
}

export async function POST(request) {
  const payload = verificarToken(extraerTokenDeCookie(request))
  if (!payload || payload.rol !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { nombre, tipo, descripcion, direccion, descuento, porcentaje_plataforma,
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

  // Verificar que el email del manager no esté en uso
  const { data: emailExistente } = await supabaseAdmin
    .from('managers_locales').select('id').eq('email', manager_email).single()
  if (emailExistente) {
    return NextResponse.json({ error: 'Ese email de manager ya está registrado' }, { status: 409 })
  }

  // 1. Crear el lugar
  const { data: lugar, error: errorLugar } = await supabaseAdmin
    .from('lugares')
    .insert({
      nombre, tipo, descripcion, direccion,
      descuento: descuento ?? 10,
      porcentaje_plataforma: porcentaje_plataforma ?? 20
    })
    .select()
    .single()

  if (errorLugar) return NextResponse.json({ error: 'Error al crear el local' }, { status: 500 })

  // 2. Crear el manager vinculado al lugar (rollback si falla)
  const password_hash = await bcrypt.hash(manager_password, 12)
  const { error: errorManager } = await supabaseAdmin
    .from('managers_locales')
    .insert({ nombre: manager_nombre, email: manager_email, password_hash, lugar_id: lugar.id, activo: true })

  if (errorManager) {
    // Rollback: borrar el lugar recién creado
    await supabaseAdmin.from('lugares').delete().eq('id', lugar.id)
    return NextResponse.json({ error: 'Error al crear el manager' }, { status: 500 })
  }

  return NextResponse.json({ lugar }, { status: 201 })
}

export async function DELETE(request) {
  const payload = verificarToken(extraerTokenDeCookie(request))
  if (!payload || payload.rol !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

  // Borrar en cascada: valoraciones → clientes → staff → manager → lugar
  await supabaseAdmin.from('valoraciones').delete().eq('lugar_id', id)
  await supabaseAdmin.from('clientes').delete().eq('lugar_id', id)
  await supabaseAdmin.from('staff').delete().eq('lugar_id', id)
  await supabaseAdmin.from('managers_locales').delete().eq('lugar_id', id)
  const { error } = await supabaseAdmin.from('lugares').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function PATCH(request) {
  const payload = verificarToken(extraerTokenDeCookie(request))
  if (!payload || payload.rol !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id, nombre, descuento, porcentaje_plataforma, activo } = await request.json()
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

  const update = {}
  if (nombre !== undefined) update.nombre = nombre
  if (descuento !== undefined) update.descuento = parseInt(descuento)
  if (porcentaje_plataforma !== undefined) update.porcentaje_plataforma = parseFloat(porcentaje_plataforma)
  if (activo !== undefined) update.activo = activo

  await supabaseAdmin.from('lugares').update(update).eq('id', id)
  return NextResponse.json({ ok: true })
}
