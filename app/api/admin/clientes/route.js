import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { verificarToken, extraerTokenDeCookie } from '../../../../lib/jwt'

export async function GET(request) {
  try {
    const payload = verificarToken(extraerTokenDeCookie(request))
    if (!payload) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    if (payload.rol !== 'superadmin') return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const busqueda = searchParams.get('busqueda') || ''
    const lugarId = searchParams.get('lugarId') || ''

    let query = supabaseAdmin
      .from('clientes')
      .select(`id, nombre, email, num_personas, verificado, verificado_at, created_at, lugar_id, referidor_id,
        lugares(nombre, porcentaje_plataforma),
        referidores(nombre, porcentaje_split, agencia_id, agencias(nombre, porcentaje_split)),
        valoraciones(gasto_confirmado, gasto_cliente, discrepancia_pct, comision_lugar, comision_agencia, comision_referidor, valoracion, ticket_url)`)
      .order('created_at', { ascending: false })
      .limit(200)

    if (busqueda) query = query.ilike('nombre', `%${busqueda}%`)
    if (lugarId) query = query.eq('lugar_id', lugarId)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ clientes: data || [] })
  } catch (e) {
    console.error('Error GET clientes admin:', e)
    return NextResponse.json({ error: 'Error cargando clientes' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const payload = verificarToken(extraerTokenDeCookie(request))
    if (!payload) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    if (payload.rol !== 'superadmin') return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

    const { id, nombre, num_personas, referidor_id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 })

    const update = {}
    if (nombre !== undefined) update.nombre = nombre.trim()
    if (num_personas !== undefined) update.num_personas = parseInt(num_personas, 10)
    if (referidor_id !== undefined) update.referidor_id = referidor_id

    const { error } = await supabaseAdmin.from('clientes').update(update).eq('id', id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Error PATCH cliente admin:', e)
    return NextResponse.json({ error: 'Error actualizando cliente' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const payload = verificarToken(extraerTokenDeCookie(request))
    if (!payload) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    if (payload.rol !== 'superadmin') return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 })

    const { error: errorVal } = await supabaseAdmin.from('valoraciones').delete().eq('cliente_id', id)
    if (errorVal) throw errorVal

    const { error: errorCli } = await supabaseAdmin.from('clientes').delete().eq('id', id)
    if (errorCli) throw errorCli

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Error DELETE cliente admin:', e)
    return NextResponse.json({ error: 'Error eliminando cliente' }, { status: 500 })
  }
}
