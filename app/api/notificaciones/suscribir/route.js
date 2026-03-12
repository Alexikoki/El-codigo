import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { verificarToken, extraerTokenDeCookie } from '../../../../lib/jwt'

export const runtime = 'nodejs' // web-push requiere Node.js runtime

// POST /api/notificaciones/suscribir
// Guarda la suscripción push del navegador del referidor en BD
export async function POST(request) {
  try {
    const payload = verificarToken(extraerTokenDeCookie(request))
    if (!payload || payload.rol !== 'referidor') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { subscription } = await request.json()
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 })
    }

    // Guardar o actualizar la suscripción (upsert por endpoint único)
    const { error } = await supabaseAdmin
      .from('push_subscriptions')
      .upsert(
        {
          referidor_id: payload.referidorId,
          endpoint: subscription.endpoint,
          subscription: subscription,
        },
        { onConflict: 'endpoint' }
      )

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error guardando suscripción push:', error)
    return NextResponse.json({ error: 'Error al registrar suscripción' }, { status: 500 })
  }
}

// DELETE /api/notificaciones/suscribir
// El referidor desactiva las notificaciones (borra su suscripción)
export async function DELETE(request) {
  try {
    const payload = verificarToken(extraerTokenDeCookie(request))
    if (!payload || payload.rol !== 'referidor') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .eq('referidor_id', payload.referidorId)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar suscripción' }, { status: 500 })
  }
}
