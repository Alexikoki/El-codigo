import { NextResponse } from 'next/server'
import { verificarToken, extraerTokenDeCookie } from './jwt'

/**
 * Middleware de autenticación para API routes.
 * Verifica token JWT y opcionalmente valida el rol.
 *
 * @param {Request} request
 * @param {string|string[]} [rolesPermitidos] - Rol o lista de roles permitidos. Si no se pasa, solo valida token.
 * @returns {{ payload: object } | { response: NextResponse }}
 */
export function requireAuth(request, rolesPermitidos) {
  const payload = verificarToken(extraerTokenDeCookie(request))

  if (!payload) {
    return { response: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  }

  if (rolesPermitidos) {
    const roles = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos]
    if (!roles.includes(payload.rol)) {
      return { response: NextResponse.json({ error: 'No autorizado' }, { status: 403 }) }
    }
  }

  return { payload }
}
