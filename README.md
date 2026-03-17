# El Código — Sistema de Referidos QR

Plataforma de gestión de referidos con QR para locales de ocio y turismo. Los referidores (RR.PP.) generan un QR personalizado que los clientes escanean al llegar al local, registrando automáticamente la visita y calculando la comisión.

## Stack

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Estilos**: Tailwind CSS v4
- **Base de datos**: Supabase (PostgreSQL + Realtime)
- **Auth**: JWT en cookies httpOnly
- **Emails**: Resend
- **Errores**: Sentry
- **Anti-bot**: Cloudflare Turnstile
- **Deploy**: Vercel

## Roles

| Rol | Acceso | Descripción |
|---|---|---|
| `superadmin` | `/superadmin` | Gestión total: locales, referidores, staff, agencias, pagos |
| `referidor` | `/referidor` | Dashboard personal, QR, invitados, liquidaciones |
| `agencia` | `/agencia` | Gestión de sus propios promotores |
| `manager` | `/manager` | Dashboard Realtime del local asignado |
| `staff` | `/staff` | Escáner QR para validar clientes |

## Desarrollo local

```bash
npm install
npm run dev
```

Requiere `.env.local` con:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
SUPERADMIN_PASSWORD=
RESEND_API_KEY=
TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_APP_URL=
```

## Tests E2E

```bash
npx playwright test
npx playwright test --ui   # modo visual
```

## Tareas y progreso

Ver [TASKS.md](./TASKS.md)
