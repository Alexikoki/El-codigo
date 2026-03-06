import QRCode from 'qrcode'
import crypto from 'crypto'

export function generarQRToken() {
  return crypto.randomBytes(4).toString('hex').toUpperCase()
}

export function firmarToken(token) {
  return token
}

export function verificarFirmaQR(token) {
  return token
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