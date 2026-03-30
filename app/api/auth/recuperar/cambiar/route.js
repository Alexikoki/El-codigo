import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase'
import { verificarToken } from '../../../../../lib/jwt'
import { checkRateLimit } from '../../../../../lib/rateLimitMiddleware'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import logger from '../../../../../lib/logger'

export async function POST(request) {
    try {
        const rl = await checkRateLimit(request, { limite: 5, ventanaMs: 15 * 60 * 1000 })
        if (rl) return rl

        const { token, nuevaPass, cfToken } = await request.json()

        if (!token || !nuevaPass || nuevaPass.length < 6 || !/[A-Z]/.test(nuevaPass)) {
            return NextResponse.json({ error: 'La contraseña debe tener mínimo 6 caracteres y al menos una mayúscula.' }, { status: 400 })
        }

        if (!cfToken) {
            return NextResponse.json({ error: 'Por favor, resuelve el CAPTCHA de seguridad.' }, { status: 400 })
        }

        // 0. Verificamos el CAPTCHA con Cloudflare
        const cfFormData = new FormData();
        cfFormData.append('secret', process.env.TURNSTILE_SECRET_KEY);
        cfFormData.append('response', cfToken);

        const cfVerify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: cfFormData
        });
        const cfResult = await cfVerify.json();

        if (!cfResult.success) {
            return NextResponse.json({ error: 'Verificación Anti-Bot fallida. Inténtalo de nuevo.' }, { status: 403 })
        }

        // 1. Verificamos la legitimidad criptográfica y caducidad del token de 1 hora
        const payload = verificarToken(token)

        if (!payload || payload.scope !== 'reset_password') {
            return NextResponse.json({ error: 'Enlace expirado o manipulado.' }, { status: 400 })
        }

        const { uid, tabla } = payload

        if (tabla !== 'referidores' && tabla !== 'staff') {
            return NextResponse.json({ error: 'Tipo de usuario inválido.' }, { status: 400 })
        }

        // 2. Verificar que el token no ha sido usado ya (one-time use)
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
        const { data: userRow } = await supabaseAdmin.from(tabla).select('reset_token_hash').eq('id', uid).single()
        if (!userRow || userRow.reset_token_hash !== tokenHash) {
            return NextResponse.json({ error: 'Enlace ya utilizado o inválido.' }, { status: 400 })
        }

        // 3. Hash seguro de la nueva clave
        const salt = await bcrypt.genSalt(10)
        const newHashedPass = await bcrypt.hash(nuevaPass, salt)

        // 4. Update contraseña e invalidar el token (reset_token_hash = null)
        const { error: updateError } = await supabaseAdmin
            .from(tabla)
            .update({ password_hash: newHashedPass, reset_token_hash: null })
            .eq('id', uid)

        if (updateError) {
            logger.error({ err: updateError }, 'Update Reset Error:')
            return NextResponse.json({ error: 'Fallo al guardar en la bóveda.' }, { status: 500 })
        }

        return NextResponse.json({ ok: true })

    } catch (globalError) {
        logger.error({ err: globalError }, 'Crash API /auth/recuperar/cambiar:')
        return NextResponse.json({ error: 'Error interno de cifrado.' }, { status: 500 })
    }
}

