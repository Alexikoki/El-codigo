// Service Worker de El Código — Cache-First para shell de la app
const CACHE_NAME = 'el-codigo-v1'

// Recursos estáticos que se pre-cachean al instalar el SW
const STATIC_ASSETS = [
  '/',
  '/login',
  '/manifest.json',
]

// === INSTALL: pre-cachear el shell ===
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// === ACTIVATE: limpiar cachés antiguas ===
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// === FETCH: Network-first para API, Cache-first para estáticos ===
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Las rutas de API siempre van a la red (nunca cachear datos de BD)
  if (url.pathname.startsWith('/api/')) {
    return // Dejar pasar sin interceptar
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        // Cachear respuestas exitosas de recursos estáticos
        if (response.ok && request.method === 'GET') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request)) // Fallback a caché si no hay red
  )
})

// === PUSH: Recibir notificaciones push del servidor ===
self.addEventListener('push', event => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body || 'Nueva validación en El Código',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'el-codigo-notif',
    renotify: true,
    data: { url: data.url || '/referidor' },
    actions: [
      { action: 'ver', title: 'Ver panel' }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title || '¡El Código!', options)
  )
})

// === NOTIFICATION CLICK: Abrir el panel al hacer clic en la notificación ===
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/referidor'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      const existingWindow = windowClients.find(w => w.url.includes(targetUrl))
      if (existingWindow) return existingWindow.focus()
      return clients.openWindow(targetUrl)
    })
  )
})
