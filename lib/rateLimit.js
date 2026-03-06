const requests = new Map()

export function rateLimit(ip, limite = 10, ventanaMs = 60000) {
  const ahora = Date.now()
  const key = ip

  if (!requests.has(key)) {
    requests.set(key, [])
  }

  // Limpiar requests fuera de la ventana
  const requestsIP = requests.get(key).filter(t => ahora - t < ventanaMs)
  requestsIP.push(ahora)
  requests.set(key, requestsIP)

  if (requestsIP.length > limite) {
    return { bloqueado: true, restantes: 0 }
  }

  return { bloqueado: false, restantes: limite - requestsIP.length }
}

export function getIP(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}