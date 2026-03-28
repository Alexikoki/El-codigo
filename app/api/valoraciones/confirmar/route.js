import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '../../../../lib/supabase'
import { requireAuth } from '../../../../lib/auth'
import { rateLimit, getIP } from '../../../../lib/rateLimit'
import { enviarEmailValoracion } from '../../../../lib/email'
import { calcularComisiones } from '../../../../lib/commissions'
import { validarImagen } from '../../../../lib/uploads'
import logger from '../../../../lib/logger'

// GET — lista de clientes verificados hoy en el local del staff
export async function GET(request) {
  const { payload, response } = requireAuth(request, 'staff')
  if (response) return response

  try {
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
  } catch (e) {
    logger.error({ err: e }, 'Error GET confirmar:')
    return NextResponse.json({ error: 'Error cargando clientes' }, { status: 500 })
  }
}

// POST — confirmar consumo real + foto del ticket
export async function POST(request) {
  const { bloqueado } = rateLimit(getIP(request), 60, 60000)
  if (bloqueado) return NextResponse.json({ error: 'Demasiadas peticiones' }, { status: 429 })

  const { payload, response } = requireAuth(request, 'staff')
  if (response) return response

  const formData = await request.formData()
  const clienteId = formData.get('clienteId')
  const gastoConfirmado = parseFloat(formData.get('gastoConfirmado'))
  const foto = formData.get('foto')

  if (!clienteId || !Number.isFinite(gastoConfirmado) || gastoConfirmado <= 0 || gastoConfirmado > 100000) {
    return NextResponse.json({ error: 'Faltan datos o importe inválido' }, { status: 400 })
  }

  // Validar foto con lib centralizada
  if (foto && foto.size > 0) {
    const check = validarImagen(foto)
    if (!check.valid) return check.response
  }

  const { data: cliente } = await supabaseAdmin
    .from('clientes')
    .select('lugar_id, referidor_id')
    .eq('id', clienteId)
    .eq('lugar_id', payload.lugarId)
    .single()

  if (!cliente) return NextResponse.json({ error: 'Cliente no encontrado en este local' }, { status: 404 })

  // Subir foto
  let ticket_url = null
  if (foto && foto.size > 0) {
    try {
      const buffer = Buffer.from(await foto.arrayBuffer())
      const { ext } = validarImagen(foto)
      const path = `${clienteId}/${Date.now()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabaseAdmin
        .storage.from('tickets')
        .upload(path, buffer, { contentType: foto.type, upsert: true })
      if (!uploadError) {
        const { data: urlData } = supabaseAdmin.storage.from('tickets').getPublicUrl(uploadData.path)
        ticket_url = urlData.publicUrl
      }
    } catch (e) {
      logger.error({ err: e }, 'Error subiendo foto:')
    }
  }

  // Calcular comisiones con lib centralizada
  const [{ data: lugar }, { data: referidor }] = await Promise.all([
    supabaseAdmin.from('lugares').select('porcentaje_plataforma').eq('id', payload.lugarId).single(),
    supabaseAdmin.from('referidores').select('agencia_id, porcentaje_split').eq('id', cliente.referidor_id).single()
  ])

  const percPlataforma = lugar?.porcentaje_plataforma != null ? parseFloat(lugar.porcentaje_plataforma) : 20
  const percReferidor = referidor?.porcentaje_split != null ? parseFloat(referidor.porcentaje_split) : 50

  let percAgencia = null
  if (referidor?.agencia_id) {
    const { data: agencia } = await supabaseAdmin.from('agencias').select('porcentaje_split').eq('id', referidor.agencia_id).single()
    percAgencia = agencia?.porcentaje_split != null ? parseFloat(agencia.porcentaje_split) : 30
  }

  const { comLugar, comReferidor, comAgencia } = calcularComisiones(gastoConfirmado, { percPlataforma, percReferidor, percAgencia })

  const tokenValoracion = crypto.randomBytes(32).toString('hex')

  const update = {
    gasto_confirmado: gastoConfirmado,
    confirmado_at: new Date().toISOString(),
    comision_lugar: comLugar,
    comision_agencia: comAgencia,
    comision_referidor: comReferidor,
    token_valoracion: tokenValoracion,
    ...(ticket_url && { ticket_url })
  }

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
      ...update
    })
    await supabaseAdmin.from('clientes').update({ gasto: gastoConfirmado }).eq('id', clienteId)
  }

  // Email de valoración
  try {
    const [{ data: clienteEmail }, { data: lugarInfo }] = await Promise.all([
      supabaseAdmin.from('clientes').select('nombre, email').eq('id', clienteId).single(),
      supabaseAdmin.from('lugares').select('nombre').eq('id', payload.lugarId).single()
    ])
    if (clienteEmail?.email) {
      await enviarEmailValoracion({
        nombre: clienteEmail.nombre,
        email: clienteEmail.email,
        clienteId,
        lugarNombre: lugarInfo?.nombre || '',
        gastoConfirmado,
        token: tokenValoracion
      })
    }
  } catch (e) {
    logger.error({ err: e }, 'Error enviando email valoración:')
  }

  // Auto-liquidaciones
  const { data: clienteInfo } = await supabaseAdmin
    .from('clientes').select('nombre').eq('id', clienteId).single()
  const hoy = new Date().toISOString().split('T')[0]
  const notaBase = `Auto · ${clienteInfo?.nombre || 'Cliente'} · Consumo: ${gastoConfirmado.toFixed(2)}€`

  if (cliente.referidor_id && comReferidor > 0) {
    await supabaseAdmin.from('liquidaciones').upsert({
      referidor_id: cliente.referidor_id,
      cliente_id: clienteId,
      importe: comReferidor,
      periodo_desde: hoy,
      periodo_hasta: hoy,
      estado: 'pendiente',
      origen: 'auto',
      notas: `${notaBase} [id:${clienteId}]`
    }, { onConflict: 'referidor_id,cliente_id', ignoreDuplicates: true })
  }

  if (referidor?.agencia_id && comAgencia > 0) {
    await supabaseAdmin.from('liquidaciones').upsert({
      agencia_id: referidor.agencia_id,
      cliente_id: clienteId,
      importe: comAgencia,
      periodo_desde: hoy,
      periodo_hasta: hoy,
      estado: 'pendiente',
      origen: 'auto',
      notas: `${notaBase} [id:${clienteId}]`
    }, { onConflict: 'agencia_id,cliente_id', ignoreDuplicates: true })
  }

  return NextResponse.json({ ok: true, ticket_url })
}
