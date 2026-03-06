import { Resend } from 'resend'
import { generarQRImage } from './qr'
import { supabaseAdmin } from './supabase'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function enviarQRPersonal({ nombre, email, clienteId, empresaNombre, descuento }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const urlValoracion = `${appUrl}/valorar/${clienteId}`
  const qrImage = await generarQRImage(urlValoracion)

  // Convertir base64 a buffer y subir a Supabase Storage
  const base64Data = qrImage.replace(/^data:image\/png;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')
  const fileName = `qr-${clienteId}.png`

  await supabaseAdmin.storage
    .from('qrs')
    .upload(fileName, buffer, { contentType: 'image/png', upsert: true })

  const { data: urlData } = supabaseAdmin.storage
    .from('qrs')
    .getPublicUrl(fileName)

  const qrUrl = urlData.publicUrl

  await resend.emails.send({
    from: 'El Código <onboarding@resend.dev>',
    to: email,
    subject: `Tu descuento del ${descuento}% en ${empresaNombre}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a;">¡Hola ${nombre}! 👋</h1>
        <p style="color: #555; font-size: 16px;">
          Tienes un <strong style="color: #2563eb;">${descuento}% de descuento</strong> 
          en <strong>${empresaNombre}</strong>.
        </p>
        <p style="color: #555; font-size: 16px;">
          Muestra este QR al camarero cuando llegues:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <img src="${qrUrl}" alt="Tu QR personal" width="250" height="250" style="display:block; margin: 0 auto;" />
        </div>
        <p style="color: #999; font-size: 13px; text-align: center;">
          Este QR es personal e intransferible.
        </p>
      </div>
    `
  })
}

export async function enviarEmailBienvenidaEmpresa({ nombre, email }) {
  await resend.emails.send({
    from: 'El Código <onboarding@resend.dev>',
    to: email,
    subject: `Bienvenido a El Código, ${nombre}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1a1a;">¡Bienvenido a El Código! 🎉</h1>
        <p style="color: #555; font-size: 16px;">
          Hola <strong>${nombre}</strong>, tu cuenta ha sido creada correctamente.
        </p>
        <p style="color: #555; font-size: 16px;">
          Ya puedes acceder a tu panel y crear tus primeros referidores.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" 
           style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px;">
          Acceder al panel
        </a>
      </div>
    `
  })
}