import QRCode from 'qrcode'
import crypto from 'crypto'

export function generarQRToken() {
  return crypto.randomBytes(16).toString('hex') // 128 bits de entropía
}

export async function generarQRImage(url) {
  return await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  })
}

export function generarCodigoConfirmacion() {
  const buf = crypto.randomBytes(4)
  return (10000 + (buf.readUInt32BE(0) % 90000)).toString()
}

export function qrExpirado(expiresAt) {
  return new Date() > new Date(expiresAt)
}