import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { generarToken } from '../../../../lib/jwt'
import { Resend } from 'resend'
import crypto from 'crypto'
import logger from '../../../../lib/logger'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://itrustb2b.com'

export async function POST(request) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json({ error: 'Falta email' }, { status: 400 })
        }

        // Búsqueda en paralelo para evitar timing attacks por enumeración de usuarios
        let user = null
        let tabla = ''

        const [{ data: referidor }, { data: staff }] = await Promise.all([
            supabaseAdmin.from('referidores').select('id, nombre').eq('email', email).single(),
            supabaseAdmin.from('staff').select('id, nombre').eq('email', email).single()
        ])

        if (referidor) { user = referidor; tabla = 'referidores' }
        else if (staff) { user = staff; tabla = 'staff' }

        // Por seguridad, si no existe simulamos el tiempo de envío para evitar timing attacks
        if (!user) {
            await new Promise(r => setTimeout(r, 300 + Math.random() * 200))
            return NextResponse.json({ ok: true })
        }

        // Generamos un token temporal de recuperación (expira en 1h)
        const resetToken = generarToken({ uid: user.id, tabla, scope: 'reset_password' }, '1h')
        const resetLink = `${APP_URL}/reset-password?token=${resetToken}`

        // Guardamos el hash del token en la DB para invalidarlo tras el primer uso
        const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')
        await supabaseAdmin.from(tabla).update({ reset_token_hash: tokenHash }).eq('id', user.id)

        // Enviamos el correo con HTML Premium
        await resend.emails.send({
            from: 'El Código <hola@itrustb2b.com>',
            to: email, // Usando email del argumento. Hasta poner dominio de pago esto va a tu spam de Resend o mail verificado
            subject: 'Recuperar acceso a El Código',
            html: `
        <div style="font-family: Arial, sans-serif; background-color: #0A0A0A; color: #FFFFFF; padding: 40px 20px; text-align: center;">
          <h2 style="color: #3b82f6;">El Código - Acceso Seguro</h2>
          <p style="font-size: 16px; color: #ccc;">Hola ${user.nombre}, has solicitado restablecer tu contraseña.</p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Restablecer Contraseña</a>
          </div>
          <p style="font-size: 12px; color: #666; margin-top: 40px;">Si no has sido tú, ignora este mensaje. El enlace caduca en 1 hora.</p>
        </div>
      `
        })

        return NextResponse.json({ ok: true })

    } catch (globalError) {
        logger.error({ err: globalError }, 'Crash API /auth/recuperar:')
        // Devolvemos 500 solo si falla la red, no si el usuario no existe.
        return NextResponse.json({ error: 'Fallo enviando correo de recuperación.' }, { status: 500 })
    }
}

