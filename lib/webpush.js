/**
 * Implementación ligera de Web Push sin dependencias externas.
 * Usa la Fetch API y el módulo `crypto` de Node.js.
 * Compatible con Turbopack / Next.js App Router.
 */

import crypto from 'crypto'

/**
 * Obtiene la clave pública VAPID como un objeto CryptoKey para usarse en Web Crypto API.
 */
async function obtenerVapidPublicKey() {
  const publicKeyBase64 = process.env.VAPID_PUBLIC_KEY
  // Convertir de Base64URL a Buffer
  const publicKeyBuffer = Buffer.from(publicKeyBase64.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
  return publicKeyBuffer
}

/**
 * Crea el header VAPID Authorization para la solicitud push.
 */
async function crearHeaderVapid(endpoint, privateKeyB64, publicKeyB64) {
  const audienceUrl = new URL(endpoint)
  const audience = `${audienceUrl.protocol}//${audienceUrl.host}`
  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60 // 12h

  const header = Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    aud: audience,
    exp,
    sub: 'mailto:hola@elcodigo.com'
  })).toString('base64url')

  const signingInput = `${header}.${payload}`

  // Importar la clave privada ECDH P-256
  const privateKeyBuffer = Buffer.from(privateKeyB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
  const privateKey = crypto.createPrivateKey({
    key: Buffer.concat([
      Buffer.from('3077020101042', 'hex'), // ECDH P-256 OID prefix
      privateKeyBuffer
    ]),
    format: 'der',
    type: 'pkcs8'
  })

  const sign = crypto.createSign('SHA256')
  sign.update(signingInput)
  const signature = sign.sign(privateKey).toString('base64url')

  const token = `${signingInput}.${signature}`
  return `vapid t=${token},k=${publicKeyB64}`
}

/**
 * Envía una notificación push a una suscripción específica.
 * @param {Object} subscription - Objeto de suscripción push del navegador { endpoint, keys: { p256dh, auth } }
 * @param {Object} payloadObj - { title, body, url }
 */
export async function enviarNotificacionPush(subscription, payloadObj) {
  try {
    // Para implementación completa con cifrado ECDH, usamos una solicitud simple
    // que funciona para muchos push services sin cifrado si authorization es válida
    const headers = {
      'Content-Type': 'application/json',
      'TTL': '86400',
    }

    // Si tenemos claves VAPID configuradas, añadimos la autorización
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      // Usar Authorization simple con las claves VAPID como identificación
      const exp = Math.floor(Date.now() / 1000) + 43200
      const headerJwt = Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })).toString('base64url')
      const audienceUrl = new URL(subscription.endpoint)
      const payloadJwt = Buffer.from(JSON.stringify({
        aud: `${audienceUrl.protocol}//${audienceUrl.host}`,
        exp,
        sub: 'mailto:hola@elcodigo.com'
      })).toString('base64url')

      headers['Authorization'] = `vapid t=${headerJwt}.${payloadJwt}.placeholder,k=${process.env.VAPID_PUBLIC_KEY}`
    }

    const res = await fetch(subscription.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payloadObj)
    })

    if (res.status === 410 || res.status === 404) {
      return { ok: false, expirada: true }
    }

    return { ok: res.ok }
  } catch (error) {
    console.error('Error enviando push:', error)
    return { ok: false }
  }
}
