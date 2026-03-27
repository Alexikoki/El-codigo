# itrustb2b — Registro de Desarrollo

> Documento generado el 26/03/2026
> Repositorio: github.com/Alexikoki/El-codigo | Dominio: itrustb2b.com

---

## Estado actual: MVP Funcional

La plataforma está desplegada en producción con todas las funcionalidades core operativas.
Stripe está en modo test (pendiente verificación de empresa).

---

## Arquitectura del proyecto

### Stack
| Componente | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router + Turbopack) |
| Estilos | Tailwind CSS v4 |
| Base de datos | Supabase (PostgreSQL + Storage) |
| Autenticación | JWT en cookies httpOnly |
| Seguridad | Cloudflare Turnstile + rate limiting |
| Emails | Resend (dominio verificado itrustb2b.com) |
| Pagos | Stripe Connect Express (modo test) |
| PWA | Service worker + manifest.json |
| i18n | 5 idiomas (ES/EN/FR/DE/NL) |
| Iconos | Lucide React |
| Animaciones | Framer Motion |

### Estructura de archivos

```
app/
├── page.js                     # Landing page con i18n
├── login/page.js               # Login unificado (5 roles)
├── superadmin/page.js          # Centro de mando completo
├── manager/page.js             # Dashboard del local
├── staff/page.js               # Escáner QR (html5-qrcode)
├── referidor/page.js           # Panel del guía/promotor
├── agencia/page.js             # Panel de la agencia
├── r/[id]/page.js              # Registro cliente vía link referidor
├── valorar/[id]/page.js        # Valoración post-visita del cliente
├── reset-password/page.js      # Recuperar contraseña
├── aviso-legal/page.js         # Aviso legal
├── privacidad/page.js          # Política de privacidad
├── terminos/page.js            # Términos de uso
├── cookies/page.js             # Política de cookies
│
├── api/
│   ├── auth/                   # Login, logout, /me, recuperar contraseña
│   ├── admin/                  # Clientes y discrepancias (superadmin)
│   ├── analytics/              # Métricas por rol (superadmin, manager, referidor, agencia)
│   ├── clientes/               # Registro de turistas
│   ├── confirmar/              # Confirmación email (código 5 dígitos)
│   ├── lugares/                # CRUD locales + cascade delete
│   ├── referidores/            # CRUD referidores + endpoint público
│   ├── agencias/               # CRUD agencias + promotores
│   ├── staff/                  # CRUD staff
│   ├── valoraciones/confirmar/ # Staff confirma visita + calcula comisiones
│   ├── valorar/[Id]/           # Cliente valora + recálculo por discrepancia
│   ├── manager/                # Staff del local + tickets
│   ├── stripe/                 # Connect, pagos, webhook
│   ├── liquidaciones/          # Gestión de liquidaciones
│   ├── facturas/               # Facturación
│   ├── export/                 # PDF liquidaciones + XLSX
│   ├── cron/                   # Resumen semanal automático
│   ├── registro/               # Registro de nuevos usuarios
│   ├── verificar/              # Verificación de tokens
│   └── notificaciones/         # Push notifications (web push)

lib/
├── supabase.js                 # Cliente Supabase admin
├── jwt.js                      # Firmar/verificar JWT + extraer de cookie
├── email.js                    # Templates email (QR, confirmación, valoración)
├── qr.js                       # Generación de QR codes
├── rateLimit.js                # Rate limiting por IP
├── stripe.js                   # Cliente Stripe
├── audit.js                    # Logging de auditoría
├── webpush.js                  # Web Push notifications
└── i18n/
    ├── translations.js         # Traducciones 5 idiomas
    └── LanguageContext.js       # Provider + hook useLanguage

components/
├── LangSelector.js             # Selector de idioma con banderas
└── Skeleton.js                 # Componentes de carga
```

### Base de datos (Supabase)

| Tabla | Descripción |
|---|---|
| `lugares` | Locales (nombre, tipo, barrio, ciudad, descuento, comision_plataforma) |
| `managers_locales` | Managers vinculados a locales |
| `staff` | Camareros vinculados a locales |
| `agencias` | Agencias de referidos |
| `referidores` | Guías/promotores (vinculados a agencia) |
| `clientes` | Turistas registrados (vinculados a lugar + referidor) |
| `valoraciones` | Visitas confirmadas (gastos, estrellas, discrepancia, comisiones, foto ticket, token) |
| `liquidaciones` | Pagos/facturas generadas |

---

## Funcionalidades implementadas

### Flujo completo de referido
1. Referidor comparte link personal `/r/{token}` con turista
2. Turista se registra: nombre, email, nº personas, **selecciona barrio → local**
3. Recibe email con QR de descuento (caduca 7 días)
4. Muestra QR al camarero al llegar
5. Staff escanea QR → confirma visita → introduce gasto total
6. Se envía email al cliente con **link seguro (token)** pidiendo valoración + cuánto pagó
7. Se calcula discrepancia staff vs cliente con alertas por severidad
8. **Si cliente reporta menos gasto, se recalculan comisiones automáticamente**
9. Se genera comisión repartida entre plataforma/referidor/agencia
10. Manager ve deuda acumulada en Pagos
11. Superadmin ve resumen mensual de discrepancias + desglose por local

### Paneles por rol

**Superadmin** (`/superadmin`)
- Métricas globales en tiempo real
- Gestión CRUD: locales, staff, referidores, agencias
- Clientes agrupados por estado con filtro por local
- Desglose de comisiones por cliente (plataforma/agencia/referidor)
- Resumen mensual de discrepancias por severidad
- Eliminar local con cascade (incluye liquidaciones)

**Manager** (`/manager`)
- Dashboard: volumen, deuda, gráfica de comisiones
- Filtros de fecha (hoy/semana/mes/año/custom)
- Tabla de clientes validados hoy + exportar CSV
- Sección "En Local Ahora" (mesas abiertas)
- Historial de tickets con fotos
- **Pestaña Pagos simplificada**: deuda acumulada + pagar con Stripe
- Pestaña Equipo: crear/activar/desactivar staff
- Realtime via Supabase channels
- Exportar PDF de liquidaciones

**Staff** (`/staff`)
- Escáner QR con html5-qrcode
- Confirma visita + introduce gasto
- Sube foto del ticket

**Referidor** (`/referidor`)
- QR personal para compartir
- Histórico de invitados
- Tracking de comisiones

**Agencia** (`/agencia`)
- Gestión de promotores
- Split de comisiones en tiempo real
- Analytics por promotor

**Cliente** (`/r/[id]` → `/valorar/[id]`)
- Registro con Turnstile CAPTCHA
- Confirmación por código email (5 dígitos)
- QR de descuento
- Valoración post-visita: estrellas + gasto propio + foto ticket

### Seguridad
- JWT en cookies httpOnly (no localStorage)
- Cloudflare Turnstile en formularios públicos
- Rate limiting: 5 intentos / 15 min en login y recuperar contraseña
- Token seguro (crypto.randomBytes) en links de valoración
- Validación de tipo MIME + tamaño en subida de fotos
- Whitelist de tablas en webhook de Stripe
- Timing normalizado en respuestas de login (anti-enumeration)
- Split de comisiones capped al 100% (no puede superar com_lugar)

### Internacionalización
- 5 idiomas: Español, English, Français, Deutsch, Nederlands
- Selector de banderas en todas las páginas
- LanguageContext + hook `useLanguage()`

### Integraciones
- **Resend**: emails transaccionales desde itrustb2b.com
- **ImprovMX**: forwarding hola@itrustb2b.com → gmail
- **Stripe Connect Express**: onboarding + pagos (modo test)
- **Supabase Storage**: fotos de tickets
- **Supabase Realtime**: notificaciones en manager

### Optimizaciones aplicadas
- Queries paralelizadas con `Promise.all()` (cascade delete, cálculo comisiones)
- Eliminado fetch redundante de `agencia_id` (traído en query inicial con join)
- Polling con backoff exponencial (4s → 60s max, hasta 15 min)

---

## Historial de cambios (últimos commits relevantes)

| Commit | Descripción |
|---|---|
| `d79b4cf` | Paralelizar queries, eliminar fetch redundante, polling con backoff |
| `84e2311` | Simplificar pagos manager, cascade delete con liquidaciones, flujo barrio→local |
| `bd30dc1` | Fix comisiones, recálculo por discrepancia y token seguro en valoración |
| `3efb3b6` | Fix 3 vulnerabilidades de seguridad en API endpoints |
| `2b9ac45` | Resumen mensual de discrepancias en superadmin métricas |
| `0ab457f` | Verificación cruzada de consumo, email post-visita, discrepancias y barrios |
| `1e52cd2` | Fix flujo valoración: cliente muestra QR con polling automático |
| `7d0c733` | Flujo de valoración post-visita con QR, estrellas y foto del ticket |
| `301af5f` | Desglose de comisiones por cliente en superadmin |
| `6e23fef` | i18n completo con 5 idiomas y selector de bandera |
| `2be3cef` | Branding: renombrar El Código a itrustb2b |

---

## Tareas pendientes

### Prioritarias (antes de ir a producción real)

| # | Tarea | Detalle |
|---|---|---|
| 1 | **Verificar empresa en Stripe** | Completar KYC para activar pagos reales |
| 2 | **Cambiar claves Stripe a live** | Actualizar STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET en Vercel |
| 3 | **Completar Aviso Legal** | Añadir NIF/CIF, dirección fiscal y datos de Registro Mercantil |
| 4 | **Crear datos demo limpios** | SQL para insertar 1 local + 1 manager + 1 staff + 1 agencia + 1 referidor con contraseñas demo |
| 5 | **Test E2E completo en producción** | Probar flujo referido → registro → QR → escaneo → valoración con datos reales |

### Mejoras opcionales

| # | Tarea | Detalle |
|---|---|---|
| 6 | Rate limiting más estricto | Evaluar límites por endpoint y por rol |
| 7 | Normalizar respuesta password recovery | Misma respuesta para email existente y no existente |
| 8 | Añadir columna `token_valoracion` a tabla | Migración SQL si no existe |
| 9 | Dashboard analytics mejorado | Gráficas comparativas mes a mes en superadmin |
| 10 | Notificaciones push al manager | Cuando llega un nuevo cliente referido |
| 11 | Tests unitarios | Cubrir lógica de comisiones y cálculo de discrepancias |
| 12 | Expiración de QR | Validar que el QR de descuento no pase de 7 días |

---

## Credenciales de demo

> Todos los roles usan la contraseña: `demo1234`

| Rol | Email | Local |
|---|---|---|
| Manager | manager@demo.com | Café de Jordaan (De Jordaan, Amsterdam) |
| Staff | staff@demo.com | Café de Jordaan |
| Agencia | agencia@demo.com | — |
| Referidor | referidor@demo.com | — (agencia: Amsterdam Tours) |
| Superadmin | *(credenciales existentes)* | — |

---

## Infraestructura

| Servicio | URL / Config |
|---|---|
| Dominio | itrustb2b.com (Namecheap → Vercel DNS) |
| Deploy | Vercel (proyecto "el-codigo") |
| Base de datos | Supabase (PostgreSQL) |
| Storage | Supabase Storage (bucket "tickets") |
| Email saliente | Resend (from: itrustb2b.com) |
| Email entrante | ImprovMX (hola@itrustb2b.com → gmail) |
| CAPTCHA | Cloudflare Turnstile |
| Pagos | Stripe Connect Express (test mode) |
| Repo | github.com/Alexikoki/El-codigo (rama master) |
