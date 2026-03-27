import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Rendimiento: 10% en producción, 100% en desarrollo
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Replay completo cuando hay error, 0% en sesiones normales
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: false,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Filtrar errores ruidosos que no aportan
  beforeSend(event) {
    // Ignorar errores de red genéricos (usuario sin conexión)
    if (event.exception?.values?.[0]?.value?.includes('Failed to fetch')) {
      return null
    }
    return event
  },
})
