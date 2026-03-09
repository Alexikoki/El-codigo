import QRCode from 'qrcode'
import crypto from 'crypto'

export function generarQRToken() {
  return crypto.randomBytes(4).toString('hex').toUpperCase()
}

export async function generarQRImage(url) {
  return await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  })
}

export function generarCodigoConfirmacion() {
  return Math.floor(10000 + Math.random() * 90000).toString()
}

export function qrExpirado(expiresAt) {
  return new Date() > new Date(expiresAt)
}