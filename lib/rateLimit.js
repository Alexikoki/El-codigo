import { supabaseAdmin } from './supabase'

/**
 * Rate limiter persistente usando Supabase.
 * Fallback a in-memory si la DB falla.
 */
const memoryFallback = new Map()

export async function rateLimit(ip, limite = 10, ventanaMs = 60000) {
  const key = `rl:${ip}`
  const ahora = new Date()
  const ventanaInicio = new Date(ahora.getTime() - ventanaMs)

  try {
    // Check existing record
    const { data: existing } = await supabaseAdmin
      .from('rate_limits')
      .select('count, window_start')
      .eq('key', key)
      .single()

    if (!existing || new Date(existing.window_start) < ventanaInicio) {
      // New window or expired — reset
      await supabaseAdmin
        .from('rate_limits')
        .upsert({ key, count: 1, window_start: ahora.toISOString() })
      return { bloqueado: false, restantes: limite - 1 }
    }

    if (existing.count >= limite) {
      return { bloqueado: true, restantes: 0 }
    }

    // Increment
    await supabaseAdmin
      .from('rate_limits')
      .update({ count: existing.count + 1 })
      .eq('key', key)

    return { bloqueado: false, restantes: limite - (existing.count + 1) }
  } catch {
    // Fallback to in-memory if DB fails
    return rateLimitMemory(ip, limite, ventanaMs)
  }
}

function rateLimitMemory(ip, limite, ventanaMs) {
  const ahora = Date.now()
  if (!memoryFallback.has(ip)) memoryFallback.set(ip, [])
  const reqs = memoryFallback.get(ip).filter(t => ahora - t < ventanaMs)
  reqs.push(ahora)
  memoryFallback.set(ip, reqs)
  if (reqs.length > limite) return { bloqueado: true, restantes: 0 }
  return { bloqueado: false, restantes: limite - reqs.length }
}

export function getIP(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}
