import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { generarToken } from '../../../lib/jwt'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  const { email, password, tipo } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  // Superadmin
  if (tipo === 'superadmin') {
    if (password === process.env.SUPERADMIN_PASSWORD) {
      const token = generarToken({ rol: 'superadmin' })
      return NextResponse.json({ token, rol: 'superadmin' })
    }
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
  }

  // Referidor
  if (tipo === 'referidor') {
    const { data: referidor } = await supabaseAdmin
      .from('referidores')
      .select('*')
      .eq('email', email)
      .eq('activo', true)
      .single()

    if (!referidor) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    const ok = await bcrypt.compare(password, referidor.password_hash)
    if (!ok) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })

    const token = generarToken({ rol: 'referidor', referidorId: referidor.id, nombre: referidor.nombre })
    return NextResponse.json({ token, rol: 'referidor', referidor: { id: referidor.id, nombre: referidor.nombre, email: referidor.email } })
  }

  // Staff
  const { data: staff } = await supabaseAdmin
    .from('staff')
    .select('*, lugares(nombre)')
    .eq('email', email)
    .eq('activo', true)
    .single()

  if (!staff) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
  const ok = await bcrypt.compare(password, staff.password_hash)
  if (!ok) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })

  const token = generarToken({ rol: 'staff', staffId: staff.id, lugarId: staff.lugar_id, nombre: staff.nombre })
  return NextResponse.json({ token, rol: 'staff', staff: { id: staff.id, nombre: staff.nombre, lugarNombre: staff.lugares.nombre } })
}