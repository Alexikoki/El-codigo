import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabase'
import { verificarToken } from '../../../../../lib/jwt'
import bcrypt from 'bcryptjs'

export async function POST(request) {
    try {
        const { token, nuevaPass, cfToken } = await request.json()

        if (!token || !nuevaPass || nuevaPass.length < 6) {
            return NextResponse.json({ error: 'Datos de restablecimiento corruptos o contraseña corta.' }, { status: 400 })
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

        // 2. Hash seguro de la nueva clave
        const salt = await bcrypt.genSalt(10)
        const newHashedPass = await bcrypt.hash(nuevaPass, salt)

        // 3. Update contra Supabase bypasseando RLS gracias al service_role de supabaseAdmin
        const { error: updateError } = await supabaseAdmin
            .from(tabla)
            .update({ password_hash: newHashedPass })
            .eq('id', uid)

        if (updateError) {
            console.error('Update Reset Error:', updateError)
            return NextResponse.json({ error: 'Fallo al guardar en la bóveda.' }, { status: 500 })
        }

        return NextResponse.json({ ok: true })

    } catch (globalError) {
        console.error('Crash API /auth/recuperar/cambiar:', globalError)
        return NextResponse.json({ error: 'Error interno de cifrado.' }, { status: 500 })
    }
}

