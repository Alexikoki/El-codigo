import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { verificarToken, extraerTokenDeCookie } from '../../../../lib/jwt'

export async function GET(request) {
  const payload = verificarToken(extraerTokenDeCookie(request))
  if (!payload || payload.rol !== 'referidor') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: clientes } = await supabaseAdmin
    .from('clientes')
    .select('id, nombre, email, num_personas, verificado, created_at, lugares(nombre)')
    .eq('referidor_id', payload.referidorId)
    .order('created_at', { ascending: false })

  if (!clientes || clientes.length === 0) {
    return NextResponse.json({ clientes: [] })
  }

  // Traemos las valoraciones de estos clientes para mostrar gasto y comisión
  const clienteIds = clientes.map(c => c.id)
  const { data: valoraciones } = await supabaseAdmin
    .from('valoraciones')
    .select('cliente_id, gasto, comision_referidor')
    .in('cliente_id', clienteIds)

  const valMap = {}
  ;(valoraciones || []).forEach(v => { valMap[v.cliente_id] = v })

  const resultado = clientes.map(c => ({
    ...c,
    gasto: valMap[c.id]?.gasto || null,
    comision: valMap[c.id]?.comision_referidor || null,
  }))

  return NextResponse.json({ clientes: resultado })
}
