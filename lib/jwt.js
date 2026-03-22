import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET

export function generarToken(payload, expiresIn = '8h') {
  return jwt.sign(payload, SECRET, { expiresIn })
}

export function verificarToken(token) {
  try {
    return jwt.verify(token, SECRET)
  } catch {
    return null
  }
}

// Lee el token desde el header Authorization (legacy fallback)
export function extraerToken(request) {
  const auth = request.headers.get('authorization') || ''
  return auth.replace('Bearer ', '')
}

// Lee el token desde la httpOnly cookie (método seguro)
export function extraerTokenDeCookie(request) {
  return request.cookies.get('auth_token')?.value || ''
}