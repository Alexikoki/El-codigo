import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { verificarToken, extraerTokenDeCookie } from '../../../../lib/jwt'
import { generarQRToken } from '../../../../lib/qr'
import bcrypt from 'bcryptjs'

export async function GET(request) {
    const payload = verificarToken(extraerTokenDeCookie(request))
    if (!payload || payload.rol !== 'agencia' || !payload.agenciaId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data } = await supabaseAdmin
        .from('referidores')
        .select('id, nombre, email, qr_token, activo, porcentaje_split, created_at')
        .eq('agencia_id', payload.agenciaId)
        .order('created_at', { ascending: false })

    return NextResponse.json({ promotores: data || [] })
}

export async function POST(request) {
    const payload = verificarToken(extraerTokenDeCookie(request))
    if (!payload || payload.rol !== 'agencia' || !payload.agenciaId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { nombre, email, password, porcentaje_split } = await request.json()
    if (!nombre || !email || !password) {
        return NextResponse.json({ error: 'Faltan datos requeridos (nombre, email, password)' }, { status: 400 })
    }

    const split_guardar = parseFloat(porcentaje_split) || 50.00;

    const password_hash = await bcrypt.hash(password, 12)
    const qr_token = generarQRToken()

    const { data, error } = await supabaseAdmin
        .from('referidores')
        .insert({
            nombre,
            email,
            password_hash,
            qr_token,
            agencia_id: payload.agenciaId,
            porcentaje_split: split_guardar
        })
        .select()
        .single()

    if (error) {
        if (error.code === '23505') return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 });
        return NextResponse.json({ error: 'Error interno al dar de alta al promotor' }, { status: 500 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://itrustb2b.com'
    return NextResponse.json({
        promotor: data,
        qrUrl: `${appUrl}/r/${qr_token}`
    }, { status: 201 })
}

export async function PATCH(request) {
    const payload = verificarToken(extraerTokenDeCookie(request))
    if (!payload || payload.rol !== 'agencia' || !payload.agenciaId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id, activo } = await request.json()

    // Seguridad extra: verificar que el referidor realmente pertenece a esa agencia antes de apagarlo
    const { data: refCheck } = await supabaseAdmin
        .from('referidores')
        .select('agencia_id')
        .eq('id', id)
        .single()

    if (!refCheck || refCheck.agencia_id !== payload.agenciaId) {
        return NextResponse.json({ error: 'Violación de seguridad: Promotor no te pertenece.' }, { status: 403 })
    }

    await supabaseAdmin.from('referidores').update({ activo }).eq('id', id)
    return NextResponse.json({ ok: true })
}

