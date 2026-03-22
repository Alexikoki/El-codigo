import { Resend } from 'resend'
import { generarQRImage } from './qr'
import { supabaseAdmin } from './supabase'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'itrustb2b <hola@itrustb2b.com>'

function emailBase(contenido) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: #1e3a5f; padding: 28px 32px;">
        <p style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">itrustb2b</p>
        <p style="margin: 4px 0 0; color: #93c5fd; font-size: 13px;">Plataforma de gestión turística</p>
      </div>
      <div style="padding: 32px;">${contenido}</div>
      <div style="border-top: 1px solid #f3f4f6; padding: 16px 32px; text-align: center;">
        <p style="margin: 0; color: #9ca3af; font-size: 11px;">© ${new Date().getFullYear()} itrustb2b · Todos los derechos reservados</p>
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
    subject: `Nueva comisión registrada: ${parseFloat(importe).toFixed(2)}€ — itrustb2b`,
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
    subject: `Pago realizado: ${parseFloat(importe).toFixed(2)}€ — itrustb2b`,
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

export async function enviarResumenSemanal({ email, nombre, stats, topReferidores, pendientes }) {
  const semana = `${new Date(Date.now() - 6 * 86400000).toLocaleDateString('es-ES')} — ${new Date().toLocaleDateString('es-ES')}`
  const filasTop = topReferidores.map((r, i) =>
    `<tr style="border-bottom:1px solid #f3f4f6;${i%2!==0?'background:#fafaf8':''}">
      <td style="padding:8px 12px;font-size:13px;color:#111111;">${r.nombre}</td>
      <td style="padding:8px 12px;font-size:13px;color:#6b7280;text-align:right;">${r.clientes}</td>
      <td style="padding:8px 12px;font-size:13px;font-weight:600;color:#1e3a5f;text-align:right;">${r.comision.toFixed(2)}€</td>
    </tr>`
  ).join('')

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Resumen semanal itrustb2b — ${semana}`,
    html: emailBase(`
      <p style="margin:0 0 4px;color:#111111;font-size:18px;font-weight:600;">Hola, ${nombre}</p>
      <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Resumen de actividad de la semana: <strong>${semana}</strong></p>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px;">
        <div style="background:#f0f4f8;border:1px solid #dce7f3;border-radius:10px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Operaciones</p>
          <p style="margin:0;color:#1e3a5f;font-size:24px;font-weight:800;">${stats.operaciones}</p>
        </div>
        <div style="background:#f0f4f8;border:1px solid #dce7f3;border-radius:10px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Volumen</p>
          <p style="margin:0;color:#1e3a5f;font-size:24px;font-weight:800;">${stats.volumen.toFixed(0)}€</p>
        </div>
        <div style="background:#f0f7f4;border:1px solid #c8e6d8;border-radius:10px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Comisiones</p>
          <p style="margin:0;color:#15803d;font-size:24px;font-weight:800;">${stats.comisiones.toFixed(0)}€</p>
        </div>
      </div>

      ${topReferidores.length > 0 ? `
      <p style="margin:0 0 10px;color:#111111;font-size:14px;font-weight:600;">Top Referidores</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:24px;">
        <thead>
          <tr style="background:#1e3a5f;">
            <th style="padding:8px 12px;color:#ffffff;font-size:11px;text-align:left;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Promotor</th>
            <th style="padding:8px 12px;color:#ffffff;font-size:11px;text-align:right;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Clientes</th>
            <th style="padding:8px 12px;color:#ffffff;font-size:11px;text-align:right;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Comisión</th>
          </tr>
        </thead>
        <tbody>${filasTop}</tbody>
      </table>` : ''}

      ${pendientes > 0 ? `
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 16px;margin-bottom:16px;">
        <p style="margin:0;color:#92400e;font-size:13px;"><strong>${pendientes}</strong> liquidación${pendientes !== 1 ? 'es' : ''} pendiente${pendientes !== 1 ? 's' : ''} de pago. Accede al panel para gestionarlas.</p>
      </div>` : ''}

      <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">Resumen automático semanal de itrustb2b.</p>
    `)
  })
}

export async function enviarCodigoConfirmacion({ nombre, email, codigo }) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Tu código de confirmación — itrustb2b',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: #1e3a5f; padding: 28px 32px;">
          <p style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">itrustb2b</p>
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
          <p style="margin: 0; color: #9ca3af; font-size: 11px;">© ${new Date().getFullYear()} itrustb2b · Todos los derechos reservados</p>
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
    from: FROM,
    to: email,
    subject: `Tu descuento del ${descuento}% en ${lugarNombre} — itrustb2b`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background: #1e3a5f; padding: 28px 32px;">
          <p style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">itrustb2b</p>
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
          <p style="margin: 0; color: #9ca3af; font-size: 11px;">© ${new Date().getFullYear()} itrustb2b · Todos los derechos reservados</p>
        </div>
      </div>
    `
  })
}