import { Resend } from 'resend'
import { generarQRImage } from './qr'
import { supabaseAdmin } from './supabase'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'El Código <onboarding@resend.dev>'

function emailBase(contenido) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: #1e3a5f; padding: 28px 32px;">
        <p style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">El Código</p>
        <p style="margin: 4px 0 0; color: #93c5fd; font-size: 13px;">Plataforma de gestión turística</p>
      </div>
      <div style="padding: 32px;">${contenido}</div>
      <div style="border-top: 1px solid #f3f4f6; padding: 16px 32px; text-align: center;">
        <p style="margin: 0; color: #9ca3af; font-size: 11px;">© ${new Date().getFullYear()} El Código S.L. · Todos los derechos reservados</p>
      </div>
    </div>
  `
}

export async function enviarEmailLiquidacionCreada({ nombre, email, importe, periodo_desde, periodo_hasta, notas }) {
  const periodoDesde = new Date(periodo_desde).toLocaleDateString('es-ES')
  const periodoHasta = new Date(periodo_hasta).toLocaleDateString('es-ES')
  const nota = notas ? notas.replace(/\s*\[id:[^\]]+\]/, '') : null

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Nueva comisión registrada: ${parseFloat(importe).toFixed(2)}€ — El Código`,
    html: emailBase(`
      <p style="margin: 0 0 8px; color: #111111; font-size: 18px; font-weight: 600;">Hola, ${nombre}</p>
      <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px; line-height: 1.5;">Se ha registrado una nueva comisión a tu favor pendiente de pago.</p>

      <div style="background: #f0f4f8; border: 1px solid #dce7f3; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Importe</p>
        <p style="margin: 0 0 16px; color: #1e3a5f; font-size: 32px; font-weight: 800;">${parseFloat(importe).toFixed(2)}€</p>
        <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Periodo</p>
        <p style="margin: 0; color: #374151; font-size: 14px; font-weight: 500;">${periodoDesde} — ${periodoHasta}</p>
        ${nota ? `<p style="margin: 12px 0 0; color: #9ca3af; font-size: 12px; font-style: italic;">${nota}</p>` : ''}
      </div>

      <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">Estado: <strong style="color: #d97706;">Pendiente de pago</strong>. Recibirás otro aviso cuando se haga efectivo.</p>
    `)
  })
}

export async function enviarEmailLiquidacionPagada({ nombre, email, importe, periodo_desde, periodo_hasta }) {
  const periodoDesde = new Date(periodo_desde).toLocaleDateString('es-ES')
  const periodoHasta = new Date(periodo_hasta).toLocaleDateString('es-ES')

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Pago realizado: ${parseFloat(importe).toFixed(2)}€ — El Código`,
    html: emailBase(`
      <p style="margin: 0 0 8px; color: #111111; font-size: 18px; font-weight: 600;">Hola, ${nombre}</p>
      <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px; line-height: 1.5;">Tu comisión ha sido marcada como pagada.</p>

      <div style="background: #f0f7f4; border: 1px solid #c8e6d8; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Importe pagado</p>
        <p style="margin: 0 0 16px; color: #15803d; font-size: 32px; font-weight: 800;">${parseFloat(importe).toFixed(2)}€</p>
        <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Periodo</p>
        <p style="margin: 0; color: #374151; font-size: 14px; font-weight: 500;">${periodoDesde} — ${periodoHasta}</p>
      </div>

      <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">Puedes ver el historial completo de pagos en tu panel.</p>
    `)
  })
}

export async function enviarCodigoConfirmacion({ nombre, email, codigo }) {
  await resend.emails.send({
    from: 'El Código <onboarding@resend.dev>',
    to: email,
    subject: 'Tu código de confirmación — El Código',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: #1e3a5f; padding: 28px 32px;">
          <p style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">El Código</p>
          <p style="margin: 4px 0 0; color: #93c5fd; font-size: 13px;">Plataforma de gestión turística</p>
        </div>
        <div style="padding: 32px;">
          <p style="margin: 0 0 8px; color: #111111; font-size: 18px; font-weight: 600;">Hola, ${nombre}</p>
          <p style="margin: 0 0 24px; color: #6b7280; font-size: 14px; line-height: 1.5;">Introduce este código para completar tu registro y acceder a tu descuento:</p>
          <div style="background: #f0f4f8; border: 1px solid #dce7f3; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #1e3a5f; font-variant-numeric: tabular-nums;">${codigo}</span>
          </div>
          <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">Este código expira en <strong>10 minutos</strong>. Si no solicitaste este código, ignora este mensaje.</p>
        </div>
        <div style="border-top: 1px solid #f3f4f6; padding: 16px 32px; text-align: center;">
          <p style="margin: 0; color: #9ca3af; font-size: 11px;">© ${new Date().getFullYear()} El Código S.L. · Todos los derechos reservados</p>
        </div>
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
    subject: `Tu descuento del ${descuento}% en ${lugarNombre} — El Código`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: #1e3a5f; padding: 28px 32px;">
          <p style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">El Código</p>
          <p style="margin: 4px 0 0; color: #93c5fd; font-size: 13px;">Tu invitación está lista</p>
        </div>
        <div style="padding: 32px;">
          <p style="margin: 0 0 8px; color: #111111; font-size: 18px; font-weight: 600;">Hola, ${nombre}</p>
          <p style="margin: 0 0 6px; color: #6b7280; font-size: 14px; line-height: 1.5;">Tienes reservado un descuento exclusivo en:</p>
          <p style="margin: 0 0 24px; color: #1e3a5f; font-size: 22px; font-weight: 700;">${lugarNombre}</p>

          <div style="background: #f0f7f4; border: 1px solid #c8e6d8; border-radius: 10px; padding: 14px 20px; margin-bottom: 24px; display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 28px; font-weight: 800; color: #15803d;">${descuento}%</span>
            <span style="color: #374151; font-size: 14px; line-height: 1.4;">de descuento aplicado automáticamente al mostrar tu QR en la entrada.</span>
          </div>

          <p style="margin: 0 0 16px; color: #374151; font-size: 14px; font-weight: 600; text-align: center;">Muestra este código QR al llegar:</p>
          <div style="text-align: center; margin-bottom: 24px;">
            <img src="${urlData.publicUrl}" alt="Tu QR personal" width="220" height="220" style="display: block; margin: 0 auto; border-radius: 8px; border: 1px solid #e5e7eb;" />
          </div>

          <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center; line-height: 1.5;">Este QR es personal e intransferible. Caduca a las 2 horas de su generación.<br>Si no solicitaste esta invitación, ignora este mensaje.</p>
        </div>
        <div style="border-top: 1px solid #f3f4f6; padding: 16px 32px; text-align: center;">
          <p style="margin: 0; color: #9ca3af; font-size: 11px;">© ${new Date().getFullYear()} El Código S.L. · Todos los derechos reservados</p>
        </div>
      </div>
    `
  })
}