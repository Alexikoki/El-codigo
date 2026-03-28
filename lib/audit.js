import { supabaseAdmin } from './supabase'
import logger from './logger'

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
    logger.error({ err: error }, 'Error audit log:')
  }
}