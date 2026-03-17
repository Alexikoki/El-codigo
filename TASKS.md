# El Código — Tareas del Proyecto

## Fase 1: Infraestructura Base

- [x] Scaffold Next.js 16 (App Router + Turbopack)
- [x] Configurar Tailwind CSS v4
- [x] Configurar Supabase (PostgreSQL)
- [x] Autenticación JWT en cookies httpOnly
- [x] Estructura de roles: superadmin, staff, manager, referidor, agencia
- [x] Tablas Supabase: clientes, lugares, referidores, staff, managers_locales, agencias, valoraciones

## Fase 2: Seguridad

- [x] JWT en cookies httpOnly (eliminar localStorage)
- [x] Rate limiting en /api/auth (10 intentos / 5 min)
- [x] Validación de inputs en todos los endpoints
- [x] Cloudflare Turnstile anti-bot en login y registro
- [x] Implementar /api/auth/me para recuperación de sesión
- [x] Revisar y aplicar políticas RLS en Supabase (Default-Deny)
- [x] Manejo global Try-Catch en endpoints críticos

## Fase 3: Paneles y Funcionalidad Core

- [x] Panel Superadmin: gestión de locales, referidores, staff y agencias
- [x] Panel Staff: escáner QR con html5-qrcode
- [x] Panel Manager: dashboard Realtime con Supabase (fix lugarId en JWT)
- [x] Panel Referidor: dashboard, QR personal, invitados, pagos
- [x] Panel Agencia: ranking de promotores, métricas, gestión
- [x] Registro de clientes con QR token (/r/[token])
- [x] Sistema de valoraciones (gasto, comisión)
- [x] Analytics superadmin con gráfica histórica (Recharts)
- [x] Analytics referidor con gráfica de comisiones

## Fase 4: Diseño y UX

- [x] Rediseño completo a estética clásica/minimalista (fondo #fafaf8, navy #1e3a5f)
- [x] Glassmorphism en cards (.glass-panel)
- [x] Skeleton loaders en todos los paneles (manager, agencia, referidor, superadmin)
- [x] Animaciones con Framer Motion (transiciones de tabs)
- [x] Mobile-First: optimizado para 375px
- [x] Buscador funcional en superadmin (filtra locales/referidores/staff)
- [x] Toast notifications (react-hot-toast)

## Fase 5: Exportación y Documentos

- [x] Exportación Excel con 5 hojas: Operaciones, Por Promotor, Por Local, Liquidaciones, Promotores
- [x] PDF de liquidación por referidor (cabecera navy, tabla profesional)
- [x] Páginas legales: Aviso Legal, Privacidad, Cookies (LSSI / RGPD)
- [x] Página 404 personalizada

## Fase 6: Sistema de Liquidaciones (Pagos a Referidores)

- [x] Tabla Supabase: liquidaciones (importe, período, estado, pagado_at)
- [x] API /api/liquidaciones (GET / POST / PATCH)
- [x] Superadmin tab Pagos: crear liquidaciones con modal
- [x] Superadmin tab Pagos: métricas resumen (pendiente / pagado / total emitido)
- [x] Superadmin tab Pagos: filtros por estado y por referidor
- [x] Superadmin: confirmación antes de marcar como pagada
- [x] Referidor tab Pagos: vista de liquidaciones oficiales
- [x] Referidor dashboard: cards de comisión pendiente vs ya cobrada
- [x] Hoja Liquidaciones incluida en exportación Excel

## Fase 7: Agencias (B2B)

- [x] API /api/agencias (GET / POST / PATCH) solo superadmin
- [x] Superadmin tab Agencias: crear, ver y suspender agencias
- [x] Agencia puede dar de alta promotores (referidores) con split configurable
- [x] Panel agencia: ranking de promotores con métricas individuales
- [x] API /api/agencias/promotores (GET / POST / PATCH)

## Fase 8: Infraestructura de Producción

- [x] PWA: manifest.json + service worker (sw.js)
- [x] Sentry: monitorización de errores (client + server + edge)
- [x] Emails transaccionales con Resend (bienvenida, estilo navy)
- [x] Tests E2E con Playwright (landing, login, registro cliente)
- [x] Despliegue en Vercel con variables de entorno configuradas

---

## Pendiente

- [ ] Rellenar datos reales en páginas legales (NIF, dirección, dominio)
- [ ] Configurar dominio personalizado en Vercel
- [ ] Verificar dominio en Resend para emails desde dominio propio
- [ ] Email automático al referidor al crear/pagar una liquidación
- [ ] Notificaciones push PWA (avisar al referidor cuando su turista es validado)
