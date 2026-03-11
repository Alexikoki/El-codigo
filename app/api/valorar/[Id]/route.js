import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'

export async function GET(request, { params }) {
  try {
    const { id } = params

    const { data: cliente, error } = await supabaseAdmin
      .from('clientes')
      .select('*, lugares(nombre, descuento)')
      .eq('id', id)
      .single()

    if (error || !cliente) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }

    if (cliente.valoracion) {
      return NextResponse.json({ yaValorado: true })
    }

    return NextResponse.json({
      cliente: { nombre: cliente.nombre },
      lugar: { nombre: cliente.lugares.nombre, descuento: cliente.lugares.descuento }
    })
  } catch (globalError) {
    console.error('Crash API /valorar GET:', globalError)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = params
    const { gasto, valoracion } = await request.json()

    if (!gasto || !valoracion || valoracion < 1 || valoracion > 5) {
      return NextResponse.json({ error: 'Datos numéricos inválidos' }, { status: 400 })
    }

    const { data: cliente, error: cliError } = await supabaseAdmin
      .from('clientes')
      .select('valoracion, lugar_id, referidor_id')
      .eq('id', id)
      .single()

    if (cliError || !cliente) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    if (cliente.valoracion) return NextResponse.json({ error: 'El ticket ya fue cobrado y valorado.' }, { status: 400 })

    // -- INICIO SPLIT ENGINE (Cálculo B2B de Comisiones Jerárquicas) --
    // 1. Obtener porcentajes base del Local y del Referidor
    const { data: lugar } = await supabaseAdmin.from('lugares').select('porcentaje_plataforma').eq('id', cliente.lugar_id).single()
    const { data: referidor } = await supabaseAdmin.from('referidores').select('agencia_id, porcentaje_split').eq('id', cliente.referidor_id).single()

    const perc_plataforma = lugar?.porcentaje_plataforma != null ? parseFloat(lugar.porcentaje_plataforma) : 20.00
    const perc_rrpp = referidor?.porcentaje_split != null ? parseFloat(referidor.porcentaje_split) : 50.00

    const com_lugar = parseFloat(gasto) * (perc_plataforma / 100)
    let com_agencia = 0
    let com_rrpp = com_lugar * (perc_rrpp / 100)

    if (referidor?.agencia_id) {
      const { data: agencia } = await supabaseAdmin.from('agencias').select('porcentaje_split').eq('id', referidor.agencia_id).single()
      const perc_agencia = agencia?.porcentaje_split != null ? parseFloat(agencia.porcentaje_split) : 30.00
      com_agencia = com_lugar * (perc_agencia / 100)
    }
    // -- FIN SPLIT ENGINE --

    await supabaseAdmin
      .from('clientes')
      .update({ gasto, valoracion, valorado_at: new Date().toISOString() })
      .eq('id', id)

    await supabaseAdmin
      .from('valoraciones')
      .insert({
        cliente_id: id,
        lugar_id: cliente.lugar_id,
        referidor_id: cliente.referidor_id,
        gasto,
        valoracion,
        comision_lugar: com_lugar,
        comision_agencia: com_agencia,
        comision_referidor: com_rrpp
      })

    return NextResponse.json({ ok: true })
  } catch (globalError) {
    console.error('Crash API /valorar POST:', globalError)
    return NextResponse.json({ error: 'Error interno registrando la recaudación.' }, { status: 500 })
  }
}