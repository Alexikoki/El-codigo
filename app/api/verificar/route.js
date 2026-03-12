import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { verificarToken, extraerTokenDeCookie } from '../../../lib/jwt'

export async function POST(request) {
  try {
    const payload = verificarToken(extraerTokenDeCookie(request))
    if (!payload || payload.rol !== 'staff') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { clienteId } = await request.json()

    const { data: cliente, error: cliError } = await supabaseAdmin
      .from('clientes')
      .select('*, lugares(nombre)')
      .eq('id', clienteId)
      .eq('lugar_id', payload.lugarId)
      .single()

    if (cliError || !cliente) {
      return NextResponse.json({ error: 'QR no válido para este local' }, { status: 404 })
    }

    if (!cliente.confirmado) {
      return NextResponse.json({ error: 'Cliente no ha confirmado su email' }, { status: 400 })
    }

    if (new Date() > new Date(cliente.qr_expira_at)) {
      return NextResponse.json({ error: 'QR expirado' }, { status: 400 })
    }

    if (cliente.verificado) {
      return NextResponse.json({ error: 'QR ya utilizado' }, { status: 400 })
    }

    await supabaseAdmin
      .from('clientes')
      .update({ verificado: true, verificado_at: new Date().toISOString() })
      .eq('id', clienteId)

    return NextResponse.json({
      ok: true,
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        numPersonas: cliente.num_personas,
        email: cliente.email
      }
    })
  } catch (globalError) {
    console.error('Crash API /verificar:', globalError)
    return NextResponse.json({ error: 'Error procesando la lectura del QR.' }, { status: 500 })
  }
}
