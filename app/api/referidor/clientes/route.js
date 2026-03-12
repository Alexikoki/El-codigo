import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { verificarToken, extraerTokenDeCookie } from '../../../../lib/jwt'

export async function GET(request) {
  const payload = verificarToken(extraerTokenDeCookie(request))
  if (!payload || payload.rol !== 'referidor') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data } = await supabaseAdmin
    .from('clientes')
    .select('*, lugares(nombre)')
    .eq('referidor_id', payload.referidorId)
    .order('created_at', { ascending: false })

  return NextResponse.json({ clientes: data || [] })
}
