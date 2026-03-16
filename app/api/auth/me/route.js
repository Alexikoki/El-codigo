import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { extraerTokenDeCookie, verificarToken } from '../../../../lib/jwt'

export async function GET(request) {
  const rawToken = extraerTokenDeCookie(request)
  const payload = verificarToken(rawToken)

  if (!payload) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { rol } = payload

  try {
    if (rol === 'superadmin') {
      return NextResponse.json({ rol: 'superadmin' })
    }

    if (rol === 'referidor') {
      const { data } = await supabaseAdmin
        .from('referidores').select('id, nombre, email, qr_token').eq('id', payload.referidorId).single()
      if (!data) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
      return NextResponse.json({ rol: 'referidor', referidor: data })
    }

    if (rol === 'agencia') {
      const { data } = await supabaseAdmin
        .from('agencias').select('id, nombre, email').eq('id', payload.agenciaId).single()
      if (!data) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
      return NextResponse.json({ rol: 'agencia', agencia: data })
    }

    if (rol === 'manager') {
      const { data } = await supabaseAdmin
        .from('managers_locales').select('id, nombre, lugar_id, lugares(nombre)').eq('id', payload.managerId).single()
      if (!data) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
      return NextResponse.json({
        rol: 'manager',
        manager: { id: data.id, nombre: data.nombre, lugarNombre: data.lugares?.nombre || 'Sin Asignar', lugarId: data.lugar_id }
      })
    }

    if (rol === 'staff') {
      const { data } = await supabaseAdmin
        .from('staff').select('id, nombre, lugar_id, lugares(nombre)').eq('id', payload.staffId).single()
      if (!data) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
      return NextResponse.json({
        rol: 'staff',
        staff: { id: data.id, nombre: data.nombre, lugarNombre: data.lugares?.nombre || 'Sin Asignar' }
      })
    }

    return NextResponse.json({ error: 'Rol desconocido' }, { status: 401 })
  } catch (e) {
    console.error('Error /api/auth/me:', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
