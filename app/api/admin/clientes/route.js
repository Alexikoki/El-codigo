import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { requireAuth } from '../../../../lib/auth'
import { checkRateLimit } from '../../../../lib/rateLimitMiddleware'
import { validateBody, clienteUpdateSchema, idSchema } from '../../../../lib/validation'

export async function GET(request) {
  const { response } = requireAuth(request, 'superadmin')
  if (response) return response

  try {
    const { searchParams } = new URL(request.url)
    const busqueda = searchParams.get('busqueda') || ''
    const lugarId = searchParams.get('lugarId') || ''
    const pagina = Math.max(1, parseInt(searchParams.get('pagina') || '1', 10))
    const porPagina = Math.min(100, Math.max(1, parseInt(searchParams.get('porPagina') || '50', 10)))
    const desde = (pagina - 1) * porPagina
    const hasta = desde + porPagina - 1

    const selectFields = `id, nombre, email, num_personas, verificado, verificado_at, created_at, lugar_id, referidor_id,
        lugares(nombre, porcentaje_plataforma),
        referidores(nombre, porcentaje_split, agencia_id, agencias(nombre, porcentaje_split)),
        valoraciones(gasto_confirmado, gasto_cliente, discrepancia_pct, comision_lugar, comision_agencia, comision_referidor, valoracion, ticket_url)`

    let query = supabaseAdmin
      .from('clientes')
      .select(selectFields, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(desde, hasta)

    if (busqueda) query = query.ilike('nombre', `%${busqueda}%`)
    if (lugarId) query = query.eq('lugar_id', lugarId)

    const { data, error, count } = await query
    if (error) throw error

    const totalPaginas = Math.ceil((count || 0) / porPagina)

    return NextResponse.json({
      clientes: data || [],
      paginacion: { pagina, porPagina, total: count || 0, totalPaginas }
    })
  } catch (e) {
    console.error('Error GET clientes admin:', e)
    return NextResponse.json({ error: 'Error cargando clientes' }, { status: 500 })
  }
}

export async function PATCH(request) {
  const rl = checkRateLimit(request, { limite: 20, ventanaMs: 60000 })
  if (rl) return rl
  const { response } = requireAuth(request, 'superadmin')
  if (response) return response

  try {
    const body = await request.json()
    const { data: validated, response: valErr } = validateBody(body, clienteUpdateSchema)
    if (valErr) return valErr
    const { id, nombre, num_personas } = validated
    const referidor_id = body.referidor_id // optional, not in schema

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
  const rl = checkRateLimit(request, { limite: 10, ventanaMs: 60000 })
  if (rl) return rl
  const { response } = requireAuth(request, 'superadmin')
  if (response) return response

  try {
    const body = await request.json()
    const result = idSchema.safeParse(body.id)
    if (!result.success) return NextResponse.json({ error: 'ID no válido' }, { status: 400 })
    const id = result.data

    await Promise.all([
      supabaseAdmin.from('valoraciones').delete().eq('cliente_id', id),
      supabaseAdmin.from('liquidaciones').delete().eq('cliente_id', id)
    ])
    const { error } = await supabaseAdmin.from('clientes').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Error DELETE cliente admin:', e)
    return NextResponse.json({ error: 'Error eliminando cliente' }, { status: 500 })
  }
}
