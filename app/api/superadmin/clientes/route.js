import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { verificarToken, extraerToken } from '../../../../lib/jwt'

export async function GET(request) {
  const payload = verificarToken(extraerToken(request))
  if (!payload || payload.rol !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: clientes } = await supabaseAdmin
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false })

  return NextResponse.json({ clientes: clientes || [] })
}