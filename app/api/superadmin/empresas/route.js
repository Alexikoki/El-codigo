import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { verificarToken, extraerToken } from '../../../../lib/jwt'

export async function GET(request) {
  const payload = verificarToken(extraerToken(request))
  if (!payload || payload.rol !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: empresas } = await supabaseAdmin
    .from('empresas')
    .select('*')
    .order('created_at', { ascending: false })

  return NextResponse.json({ empresas: empresas || [] })
}

export async function PATCH(request) {
  const payload = verificarToken(extraerToken(request))
  if (!payload || payload.rol !== 'superadmin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id, activo } = await request.json()

  const { error } = await supabaseAdmin
    .from('empresas')
    .update({ activo })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}