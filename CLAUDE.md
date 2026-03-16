# CLAUDE.md — Guía de Desarrollo para "El Código"

## 👤 Perfil del Asistente
- **Idioma**: Español.
- **Tono**: Profesional, técnico y colaborativo (Pair Programming).
- **Estilo de Respuesta**: Directo al grano, priorizando la implementación de código sobre explicaciones extensas, pero siempre detallando cambios críticos.

## 🎨 Guía de Diseño (Estética Clásica/Minimalista)
- **Tema**: Claro y limpio. Fondos blancos o neutros cálidos (`#fafaf8`, `#f5f5f0`).
- **Acentos**: Un único color de acento sobrio (ej. azul oscuro `#1e3a5f`, verde salvia, o gris cálido).
- **Tipografía**: Serif elegante o sans-serif limpio. Generoso espaciado y jerarquía clara.
- **Espaciado**: Whitespace generoso. Layouts alineados y ordenados.
- **IMPORTANTE**: Evitar glassmorphism, neón, gradientes agresivos y efectos gaming. Priorizar claridad, legibilidad y profesionalismo.

## 💻 Stack Técnico
- **Framework**: Next.js 16 (App Router + Turbopack).
- **Estilos**: Tailwind CSS v4.
- **Base de Datos**: Supabase (PostgreSQL).
- **Autenticación**: JWT en Cookies **httpOnly** (evitar localStorage por seguridad).
- **Componentes**: Lucide React para iconos, Framer Motion para animaciones.

## 🛠️ Reglas Específicas del Proyecto
1. **Seguridad**: Todos los endpoints de `/api/` deben verificar la sesión mediante cookies.
2. **PWA**: Mantener compatibilidad con el `sw.js` y el `manifest.json`.
3. **QR**: La lógica de escaneo principal está en `app/staff/page.js` usando `html5-qrcode`.
4. **Mobile-First**: Toda interfaz debe ser probada y optimizada para pantallas pequeñas (375px).

## 🚫 Qué Evitar
- No cambiar la fuente Geist a menos que se pida específicamente.
- No mover la lógica de autenticación fuera de las cookies httpOnly.
- No introducir efectos gaming (neón, glassmorphism, gradientes radiales agresivos).
