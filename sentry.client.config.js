import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,       // 10% de trazas de rendimiento
  replaysOnErrorSampleRate: 1.0, // Replay completo en errores
  replaysSessionSampleRate: 0,   // Sin replay en sesiones normales
  integrations: [
    Sentry.replayIntegration({ maskAllText: true, blockAllMedia: false }),
  ],
})
