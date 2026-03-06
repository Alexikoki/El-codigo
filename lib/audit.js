import { supabaseAdmin } from './supabase'

export async function registrarAudit({ tabla, accion, registroId, empresaId, datos, ip }) {
  try {
    await supabaseAdmin.from('audit_log').insert({
      tabla,
      accion,
      registro_id: registroId,
      empresa_id: empresaId,
      datos,
      ip
    })
  } catch (error) {
    console.error('Error audit log:', error)
  }
}