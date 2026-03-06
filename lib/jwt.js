import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET

export function generarToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '8h' })
}

export function verificarToken(token) {
  try {
    return jwt.verify(token, SECRET)
  } catch {
    return null
  }
}

export function extraerToken(request) {
  const auth = request.headers.get('authorization')
  if (!auth || !auth.startsWith('Bearer ')) return null
  return auth.split(' ')[1]
}