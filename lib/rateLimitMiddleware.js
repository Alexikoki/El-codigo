import { NextResponse } from 'next/server'
import { rateLimit, getIP } from './rateLimit'

/**
 * Middleware de rate limiting para rutas API.
 * Devuelve null si pasa el check, o un NextResponse 429 si está bloqueado.
 *
 * @param {Request} request
 * @param {{ limite?: number, ventanaMs?: number }} opciones
 * @returns {Promise<NextResponse|null>}
 */
export async function checkRateLimit(request, { limite = 20, ventanaMs = 60000 } = {}) {
  const ip = getIP(request)
  const path = new URL(request.url).pathname
  const { bloqueado } = await rateLimit(`${ip}:${path}`, limite, ventanaMs)

  if (bloqueado) {
    return NextResponse.json(
      { error: 'Demasiadas peticiones. Intenta de nuevo en unos segundos.' },
      { status: 429 }
    )
  }

  return null
}
