import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  const { data } = await supabaseAdmin
    .from('referidores')
    .select('nombre')
    .eq('qr_token', token)
    .eq('activo', true)
    .single()

  if (!data) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ nombre: data.nombre })
}