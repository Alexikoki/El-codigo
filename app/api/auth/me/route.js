import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { requireAuth } from '../../../../lib/auth'
import logger from '../../../../lib/logger'

export async function GET(request) {
  const { payload, response } = requireAuth(request)
  if (response) return response

  const { rol } = payload

  try {
    const exp = payload.exp || null

    if (rol === 'superadmin') {
      return NextResponse.json({ rol: 'superadmin', exp })
    }

    if (rol === 'referidor') {
      const { data } = await supabaseAdmin
        .from('referidores').select('id, nombre, email, qr_token').eq('id', payload.referidorId).single()
      if (!data) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
      return NextResponse.json({ rol: 'referidor', referidor: data, exp })
    }

    if (rol === 'agencia') {
      const { data } = await supabaseAdmin
        .from('agencias').select('id, nombre, email').eq('id', payload.agenciaId).single()
      if (!data) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
      return NextResponse.json({ rol: 'agencia', agencia: data, exp })
    }

    if (rol === 'manager') {
      const { data } = await supabaseAdmin
        .from('managers_locales').select('id, nombre, lugar_id, lugares(nombre)').eq('id', payload.managerId).single()
      if (!data) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
      return NextResponse.json({
        rol: 'manager',
        manager: { id: data.id, nombre: data.nombre, lugarNombre: data.lugares?.nombre || 'Sin Asignar', lugarId: data.lugar_id },
        exp
      })
    }

    if (rol === 'staff') {
      const { data } = await supabaseAdmin
        .from('staff').select('id, nombre, lugar_id, lugares(nombre)').eq('id', payload.staffId).single()
      if (!data) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
      return NextResponse.json({
        rol: 'staff',
        staff: { id: data.id, nombre: data.nombre, lugarNombre: data.lugares?.nombre || 'Sin Asignar' },
        exp
      })
    }

    return NextResponse.json({ error: 'Rol desconocido' }, { status: 401 })
  } catch (e) {
    logger.error({ err: e }, 'Error /api/auth/me:')
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
