import QRCode from 'qrcode'
import crypto from 'crypto'

export function generarQRToken() {
  return crypto.randomBytes(32).toString('hex')
}

export function firmarToken(token) {
  const secret = process.env.JWT_SECRET
  const firma = crypto
    .createHmac('sha256', secret)
    .update(token)
    .digest('hex')
  return `${token}.${firma}`
}

export function verificarFirmaQR(tokenFirmado) {
  try {
    const [token, firma] = tokenFirmado.split('.')
    const secret = process.env.JWT_SECRET
    const firmaEsperada = crypto
      .createHmac('sha256', secret)
      .update(token)
      .digest('hex')
    return firma === firmaEsperada ? token : null
  } catch {
    return null
  }
}

export async function generarQRImage(url) {
  return await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  })
}