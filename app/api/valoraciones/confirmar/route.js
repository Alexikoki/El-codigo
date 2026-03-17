import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { verificarToken, extraerTokenDeCookie } from '../../../../lib/jwt'

// GET — lista de clientes verificados hoy en el local del staff
export async function GET(request) {
  const payload = verificarToken(extraerTokenDeCookie(request))
  if (!payload || payload.rol !== 'staff') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const hoyInicio = new Date()
  hoyInicio.setHours(0, 0, 0, 0)

  const { data: clientes } = await supabaseAdmin
    .from('clientes')
    .select('id, nombre, num_personas, verificado_at, referidores(nombre)')
    .eq('lugar_id', payload.lugarId)
    .eq('verificado', true)
    .gte('verificado_at', hoyInicio.toISOString())
    .order('verificado_at', { ascending: false })

  if (!clientes?.length) return NextResponse.json({ clientes: [] })

  const ids = clientes.map(c => c.id)
  const { data: valoraciones } = await supabaseAdmin
    .from('valoraciones')
    .select('cliente_id, gasto, gasto_confirmado, ticket_url, confirmado_at')
    .in('cliente_id', ids)

  const resultado = clientes.map(c => {
    const val = valoraciones?.find(v => v.cliente_id === c.id)
    return {
      id: c.id,
      nombre: c.nombre,
      personas: c.num_personas,
      hora: new Date(c.verificado_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      referidor: c.referidores?.nombre || '—',
      gastoEstimado: val?.gasto || null,
      gastoConfirmado: val?.gasto_confirmado || null,
      ticketUrl: val?.ticket_url || null,
      confirmado: !!val?.confirmado_at
    }
  })

  return NextResponse.json({ clientes: resultado })
}

// POST — confirmar consumo real + foto del ticket
export async function POST(request) {
  const payload = verificarToken(extraerTokenDeCookie(request))
  if (!payload || payload.rol !== 'staff') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const formData = await request.formData()
  const clienteId = formData.get('clienteId')
  const gastoConfirmado = parseFloat(formData.get('gastoConfirmado'))
  const foto = formData.get('foto')

  if (!clienteId || isNaN(gastoConfirmado) || gastoConfirmado <= 0) {
    return NextResponse.json({ error: 'Faltan datos o importe inválido' }, { status: 400 })
  }

  // Verificar que el cliente pertenece al local del staff
  const { data: cliente } = await supabaseAdmin
    .from('clientes')
    .select('lugar_id, referidor_id')
    .eq('id', clienteId)
    .eq('lugar_id', payload.lugarId)
    .single()

  if (!cliente) return NextResponse.json({ error: 'Cliente no encontrado en este local' }, { status: 404 })

  // Subir foto si se proporcionó
  let ticket_url = null
  if (foto && foto.size > 0) {
    try {
      const buffer = Buffer.from(await foto.arrayBuffer())
      const ext = foto.type === 'image/png' ? 'png' : 'jpg'
      const path = `${clienteId}/${Date.now()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabaseAdmin
        .storage.from('tickets')
        .upload(path, buffer, { contentType: foto.type, upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabaseAdmin.storage.from('tickets').getPublicUrl(uploadData.path)
        ticket_url = urlData.publicUrl
      }
    } catch (e) {
      console.error('Error subiendo foto:', e)
      // No bloqueamos la confirmación si falla la foto
    }
  }

  // Calcular comisiones con el importe confirmado
  const { data: lugar } = await supabaseAdmin.from('lugares').select('porcentaje_plataforma').eq('id', payload.lugarId).single()
  const { data: referidor } = await supabaseAdmin.from('referidores').select('agencia_id, porcentaje_split').eq('id', cliente.referidor_id).single()

  const perc_plataforma = lugar?.porcentaje_plataforma != null ? parseFloat(lugar.porcentaje_plataforma) : 20.00
  const perc_rrpp = referidor?.porcentaje_split != null ? parseFloat(referidor.porcentaje_split) : 50.00

  const com_lugar = gastoConfirmado * (perc_plataforma / 100)
  let com_agencia = 0
  let com_rrpp = com_lugar * (perc_rrpp / 100)

  if (referidor?.agencia_id) {
    const { data: agencia } = await supabaseAdmin.from('agencias').select('porcentaje_split').eq('id', referidor.agencia_id).single()
    const perc_agencia = agencia?.porcentaje_split != null ? parseFloat(agencia.porcentaje_split) : 30.00
    com_agencia = com_lugar * (perc_agencia / 100)
    com_rrpp = com_lugar * (perc_rrpp / 100)
  }

  const update = {
    gasto_confirmado: gastoConfirmado,
    confirmado_at: new Date().toISOString(),
    comision_lugar: com_lugar,
    comision_agencia: com_agencia,
    comision_referidor: com_rrpp,
    ...(ticket_url && { ticket_url })
  }

  // Actualizar si ya existe, crear si no
  const { data: existente } = await supabaseAdmin
    .from('valoraciones')
    .select('id')
    .eq('cliente_id', clienteId)
    .single()

  if (existente) {
    await supabaseAdmin.from('valoraciones').update(update).eq('id', existente.id)
  } else {
    await supabaseAdmin.from('valoraciones').insert({
      cliente_id: clienteId,
      lugar_id: payload.lugarId,
      referidor_id: cliente.referidor_id,
      gasto: gastoConfirmado,
      valoracion: 5,
      ...update
    })
    await supabaseAdmin.from('clientes').update({
      gasto: gastoConfirmado, valoracion: 5, valorado_at: new Date().toISOString()
    }).eq('id', clienteId)
  }

  // ── Auto-liquidaciones ──────────────────────────────────────────
  // Obtener nombre del cliente para la nota
  const { data: clienteInfo } = await supabaseAdmin
    .from('clientes').select('nombre').eq('id', clienteId).single()
  const hoy = new Date().toISOString().split('T')[0]
  const notaBase = `Auto · ${clienteInfo?.nombre || 'Cliente'} · Consumo: ${gastoConfirmado.toFixed(2)}€`

  // Liquidación para el referidor (si tiene comisión > 0)
  if (cliente.referidor_id && com_rrpp > 0) {
    // Evitar duplicados: comprobar si ya existe liquidación auto para este cliente hoy
    const { data: liqExistente } = await supabaseAdmin
      .from('liquidaciones')
      .select('id')
      .eq('referidor_id', cliente.referidor_id)
      .eq('origen', 'auto')
      .ilike('notas', `%${clienteId}%`)
      .single()

    if (!liqExistente) {
      await supabaseAdmin.from('liquidaciones').insert({
        referidor_id: cliente.referidor_id,
        importe: parseFloat(com_rrpp.toFixed(2)),
        periodo_desde: hoy,
        periodo_hasta: hoy,
        estado: 'pendiente',
        origen: 'auto',
        notas: `${notaBase} [id:${clienteId}]`
      })
    }
  }

  // Liquidación para la agencia (si tiene comisión > 0)
  if (referidor?.agencia_id && com_agencia > 0) {
    const { data: liqAgExistente } = await supabaseAdmin
      .from('liquidaciones')
      .select('id')
      .eq('agencia_id', referidor.agencia_id)
      .eq('origen', 'auto')
      .ilike('notas', `%${clienteId}%`)
      .single()

    if (!liqAgExistente) {
      await supabaseAdmin.from('liquidaciones').insert({
        agencia_id: referidor.agencia_id,
        importe: parseFloat(com_agencia.toFixed(2)),
        periodo_desde: hoy,
        periodo_hasta: hoy,
        estado: 'pendiente',
        origen: 'auto',
        notas: `${notaBase} [id:${clienteId}]`
      })
    }
  }

  return NextResponse.json({ ok: true, ticket_url })
}
