import { Resend } from 'resend'
import { generarQRImage } from './qr'
import { supabaseAdmin } from './supabase'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function enviarCodigoConfirmacion({ nombre, email, codigo }) {
  await resend.emails.send({
    from: 'El Código <onboarding@resend.dev>',
    to: email,
    subject: 'Tu código de confirmación — El Código',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a;">¡Hola ${nombre}! 👋</h1>
        <p style="color: #555; font-size: 16px;">Tu código de confirmación es:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 48px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${codigo}</span>
        </div>
        <p style="color: #999; font-size: 13px; text-align: center;">Este código expira en 10 minutos.</p>
      </div>
    `
  })
}

export async function enviarQRPersonal({ nombre, email, clienteId, lugarNombre, descuento }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const urlValoracion = `${appUrl}/valorar/${clienteId}`
  const qrImage = await generarQRImage(urlValoracion)

  const base64Data = qrImage.replace(/^data:image\/png;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')
  const fileName = `qr-${clienteId}.png`

  await supabaseAdmin.storage
    .from('qrs')
    .upload(fileName, buffer, { contentType: 'image/png', upsert: true })

  const { data: urlData } = supabaseAdmin.storage
    .from('qrs')
    .getPublicUrl(fileName)

  await resend.emails.send({
    from: 'El Código <onboarding@resend.dev>',
    to: email,
    subject: `Tu descuento del ${descuento}% en ${lugarNombre}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a;">¡Hola ${nombre}! 👋</h1>
        <p style="color: #555; font-size: 16px;">
          Tienes un <strong style="color: #2563eb;">${descuento}% de descuento</strong> en <strong>${lugarNombre}</strong>.
        </p>
        <p style="color: #555; font-size: 16px;">Muestra este QR al llegar:</p>
        <div style="text-align: center; margin: 30px 0;">
          <img src="${urlData.publicUrl}" alt="Tu QR personal" width="250" height="250" style="display:block; margin: 0 auto;" />
        </div>
        <p style="color: #999; font-size: 13px; text-align: center;">Este QR es personal e intransferible. Válido 2 horas.</p>
      </div>
    `
  })
}