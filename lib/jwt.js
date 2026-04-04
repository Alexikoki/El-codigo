import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET
if (!SECRET && process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET no configurado')

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

// Lee el token desde la httpOnly cookie (método seguro)
export function extraerTokenDeCookie(request) {
  return request.cookies.get('auth_token')?.value || ''
}