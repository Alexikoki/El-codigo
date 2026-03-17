import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) return NextResponse.json({ error: 'Token no especificado' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('referidores')
      .select('nombre')
      .eq('qr_token', token)
      .eq('activo', true)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Guía no encontrado' }, { status: 404 })

    return NextResponse.json({ nombre: data.nombre })
  } catch (globalError) {
    console.error('Crash API /referidores/publico:', globalError)
    return NextResponse.json({ error: 'Fallo interno recuperando datos.' }, { status: 500 })
  }
}
