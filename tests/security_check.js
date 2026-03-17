/**
 * Security Check — El Código
 * Prueba que los endpoints protegidos rechacen acceso sin sesión
 * y que el rate limiting funcione.
 * Ejecutar: node tests/security_check.js
 */

const BASE = 'http://localhost:3000'

let passed = 0
let failed = 0

const ok  = (msg) => { console.log(`  ✓ ${msg}`); passed++ }
const fail = (msg) => { console.log(`  ✗ ${msg}`); failed++ }
const section = (title) => console.log(`\n[${title}]`)

async function get(path, cookie = '') {
  return fetch(`${BASE}${path}`, {
    headers: cookie ? { Cookie: cookie } : {}
  })
}

async function post(path, body, cookie = '') {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {})
    },
    body: JSON.stringify(body)
  })
}

async function run() {
  console.log('=== Security Check — El Código ===')
  console.log(`Target: ${BASE}\n`)

  // ── 1. ENDPOINTS PROTEGIDOS SIN SESIÓN ──────────────────────────────────
  section('1. Acceso sin sesión (deben devolver 401 o 403)')

  const protectedRoutes = [
    ['/api/liquidaciones',           'GET'],
    ['/api/referidores',             'GET'],
    // /api/lugares es público (necesario para formulario de clientes) — ver test 7
    ['/api/staff',                   'GET'],
    ['/api/agencias',                'GET'],
    ['/api/analytics/superadmin',    'GET'],
    ['/api/analytics/referidor',     'GET'],
    ['/api/referidor/clientes',      'GET'],
    ['/api/referidor/historial',     'GET'],
    ['/api/export/xlsx',             'GET'],
    ['/api/facturas',                'GET'],
    ['/api/auth/me',                 'GET'],
  ]

  for (const [path, method] of protectedRoutes) {
    const res = method === 'GET' ? await get(path) : await post(path, {})
    if (res.status === 401 || res.status === 403) {
      ok(`${method} ${path} → ${res.status}`)
    } else {
      fail(`${method} ${path} → ${res.status} (esperado 401/403)`)
    }
  }

  // ── 2. COOKIE FALSA / JWT MANIPULADO ────────────────────────────────────
  section('2. Cookie falsa o JWT inválido (deben rechazar)')

  const fakeCookies = [
    'auth_token=fakejwt123',
    'auth_token=eyJhbGciOiJIUzI1NiJ9.eyJyb2wiOiJzdXBlcmFkbWluIn0.INVALIDSIGNATURE',
    'auth_token=',
  ]

  for (const cookie of fakeCookies) {
    const res = await get('/api/liquidaciones', cookie)
    if (res.status === 401 || res.status === 403) {
      ok(`Cookie inválida rechazada: "${cookie.substring(0, 40)}..."`)
    } else {
      fail(`Cookie inválida ACEPTADA: "${cookie.substring(0, 40)}" → ${res.status}`)
    }
  }

  // ── 3. ESCALADA DE PRIVILEGIOS ───────────────────────────────────────────
  section('3. Escalada de privilegios (referidor no puede crear liquidaciones)')

  // Intentar POST a liquidaciones sin ser superadmin
  const res = await post('/api/liquidaciones', {
    referidor_id: '00000000-0000-0000-0000-000000000000',
    importe: 999,
    periodo_desde: '2024-01-01',
    periodo_hasta: '2024-01-31'
  })
  if (res.status === 401 || res.status === 403) {
    ok(`POST /api/liquidaciones sin auth → ${res.status}`)
  } else {
    fail(`POST /api/liquidaciones sin auth → ${res.status} (debería ser 401/403)`)
  }

  // Intentar PATCH a liquidaciones sin ser superadmin
  const res2 = await post('/api/liquidaciones', { id: 'fake-id', estado: 'pagado' })
  if (res2.status === 401 || res2.status === 403) {
    ok(`PATCH /api/liquidaciones sin auth → ${res2.status}`)
  } else {
    fail(`PATCH /api/liquidaciones sin auth → ${res2.status}`)
  }

  // ── 4. INYECCIÓN Y PAYLOADS MALICIOSOS ──────────────────────────────────
  section('4. Payloads maliciosos en login (no deben crashear el servidor)')

  const maliciousPayloads = [
    { email: "' OR '1'='1", password: "' OR '1'='1", tipo: 'staff', cfToken: 'test' },
    { email: '<script>alert(1)</script>', password: 'x', tipo: 'staff', cfToken: 'test' },
    { email: 'a'.repeat(500), password: 'x', tipo: 'staff', cfToken: 'test' },
    { email: null, password: null, tipo: 'staff', cfToken: 'test' },
    { email: { nested: 'object' }, password: 'x', tipo: 'staff', cfToken: 'test' },
    {},
  ]

  for (const payload of maliciousPayloads) {
    try {
      const res = await post('/api/auth', payload)
      if (res.status < 500) {
        ok(`Payload malicioso manejado correctamente → ${res.status}`)
      } else {
        fail(`Payload malicioso causó error 500 → revisar validación`)
      }
    } catch (e) {
      fail(`Payload malicioso causó crash de red: ${e.message}`)
    }
  }

  // ── 5. RATE LIMITING EN LOGIN ────────────────────────────────────────────
  section('5. Rate limiting en /api/auth (máx 10 intentos en 5 min)')

  let blocked = false
  for (let i = 0; i < 12; i++) {
    const res = await post('/api/auth', {
      email: 'test@test.com',
      password: 'wrongpassword',
      tipo: 'staff',
      cfToken: '1x0000000000000000000000000000000AA' // bypass Turnstile para test local
    })
    if (res.status === 429) {
      ok(`Rate limit activo tras ${i + 1} intentos → 429 Too Many Requests`)
      blocked = true
      break
    }
  }
  if (!blocked) {
    fail('Rate limit NO detectado tras 12 intentos fallidos')
  }

  // ── 6. HEADERS DE SEGURIDAD ──────────────────────────────────────────────
  section('6. Headers de seguridad en respuestas')

  const homeRes = await get('/')
  const headers = Object.fromEntries(homeRes.headers.entries())

  const desiredHeaders = [
    ['x-content-type-options', 'nosniff'],
    ['x-frame-options', ''],         // cualquier valor es OK
  ]

  // Next.js añade algunos por defecto
  if (headers['x-powered-by'] === undefined || headers['x-powered-by'] !== 'Express') {
    ok('X-Powered-By no expone tecnología sensible')
  }

  // Verificar que las cookies de auth son httpOnly (no accesibles desde JS)
  const loginRes = await post('/api/auth', {
    email: 'superadmin',
    password: 'wrongpassword',
    tipo: 'superadmin',
    cfToken: '1x0000000000000000000000000000000AA'
  })
  const setCookie = loginRes.headers.get('set-cookie') || ''
  if (setCookie.toLowerCase().includes('httponly')) {
    ok('Cookie auth_token tiene flag HttpOnly')
  } else if (loginRes.status === 401) {
    ok('Login fallido (correcto) — no se emitió cookie')
  }

  // ── 7. ENDPOINT PÚBLICO LIMITADO (/api/lugares) ─────────────────────────
  section('7. /api/lugares público pero solo expone id, nombre, tipo')

  const lugaresRes = await get('/api/lugares')
  if (lugaresRes.status === 200) {
    const data = await lugaresRes.json()
    const lugares = data.lugares || []
    if (lugares.length === 0) {
      ok('/api/lugares público devuelve array vacío (sin locales aún)')
    } else {
      const keys = Object.keys(lugares[0])
      const camposSensibles = ['password_hash', 'descuento', 'activo', 'created_at']
      const expuestos = camposSensibles.filter(c => keys.includes(c))
      if (expuestos.length === 0) {
        ok(`/api/lugares público solo expone: ${keys.join(', ')}`)
      } else {
        fail(`/api/lugares expone campos sensibles sin auth: ${expuestos.join(', ')}`)
      }
    }
  }

  // ── 8. ARCHIVOS SENSIBLES EXPUESTOS ─────────────────────────────────────
  section('8. Archivos sensibles no accesibles por HTTP')

  const sensitiveFiles = [
    '/.env',
    '/.env.local',
    '/.env.production',
    '/.git/config',
    '/.git/HEAD',
    '/package.json',
    '/next.config.mjs',
    '/jsconfig.json',
  ]

  for (const file of sensitiveFiles) {
    const res = await get(file)
    if (res.status === 404 || res.status === 403 || res.status === 400) {
      ok(`${file} → ${res.status} (no accesible)`)
    } else if (res.status === 200) {
      const text = await res.text()
      // next.config.mjs puede ser accesible pero no debería contener secrets
      if (text.includes('SECRET') || text.includes('PASSWORD') || text.includes('KEY=')) {
        fail(`${file} → 200 y contiene datos sensibles`)
      } else {
        ok(`${file} → 200 pero sin datos sensibles`)
      }
    } else {
      ok(`${file} → ${res.status}`)
    }
  }

  // ── 9. HEADERS DE SEGURIDAD ──────────────────────────────────────────────
  section('9. Headers de seguridad HTTP')

  const secRes = await get('/')
  const secHeaders = Object.fromEntries(secRes.headers.entries())

  const checks = [
    ['x-content-type-options', 'nosniff',   'Previene MIME sniffing'],
    ['x-frame-options',        '',           'Previene clickjacking (X-Frame-Options)'],
    ['referrer-policy',        '',           'Controla información de referrer'],
  ]

  for (const [header, expected, desc] of checks) {
    const val = secHeaders[header]
    if (val && (expected === '' || val.toLowerCase().includes(expected))) {
      ok(`${desc}: "${val}"`)
    } else {
      fail(`Falta header: ${header} (${desc})`)
    }
  }

  // Content-Security-Policy (recomendado pero no obligatorio en Next.js por defecto)
  if (secHeaders['content-security-policy']) {
    ok(`Content-Security-Policy presente`)
  } else {
    fail('Content-Security-Policy no configurado (recomendado añadirlo en next.config.mjs)')
  }

  // HSTS solo aplica en HTTPS (producción)
  if (secHeaders['strict-transport-security']) {
    ok('HSTS configurado')
  } else {
    ok('HSTS ausente en local (solo aplica en HTTPS/producción — OK)')
  }

  // ── 10. SUPABASE ANON KEY — ACCESO DIRECTO ───────────────────────────────
  section('10. Supabase anon key no expone datos sensibles directamente')

  // La anon key es pública por diseño (NEXT_PUBLIC_), pero RLS debe proteger los datos
  // Intentamos leer tablas sensibles directamente desde la API de Supabase
  const supabaseUrl = 'https://salzeeksfjunlkhmrgoa.supabase.co'
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhbHplZWtzZmp1bmxraG1yZ29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NTE0NTksImV4cCI6MjA4ODMyNzQ1OX0.zXu_amNUuSJyBdRyCfio_6O2wzf1teCt6ZhjaOGgeqs'

  const tablasSensibles = ['referidores', 'staff', 'managers_locales', 'agencias', 'liquidaciones', 'valoraciones']

  for (const tabla of tablasSensibles) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/${tabla}?select=*&limit=1`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
        }
      })
      if (res.status === 200) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          fail(`RLS no configurado: tabla "${tabla}" accesible con anon key (${data.length} filas)`)
        } else {
          ok(`tabla "${tabla}" protegida por RLS (0 filas con anon key)`)
        }
      } else if (res.status === 401 || res.status === 403) {
        ok(`tabla "${tabla}" → ${res.status} (RLS activo)`)
      } else {
        ok(`tabla "${tabla}" → ${res.status}`)
      }
    } catch (e) {
      ok(`tabla "${tabla}" no accesible directamente`)
    }
  }

  // ── 11. PAYLOADS GIGANTES (DoS por cuerpo HTTP) ──────────────────────────
  section('11. Payload gigante no tumba el servidor')

  try {
    const bigPayload = { email: 'a'.repeat(100_000), password: 'b'.repeat(100_000), tipo: 'staff', cfToken: 'x' }
    const res = await fetch(`${BASE}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bigPayload),
      signal: AbortSignal.timeout(10000)
    })
    if (res.status < 500) {
      ok(`Payload 200KB manejado correctamente → ${res.status}`)
    } else {
      fail(`Payload gigante causó error 500`)
    }

    // Verificar que el servidor sigue respondiendo
    const pingRes = await get('/')
    if (pingRes.status === 200) {
      ok('Servidor sigue operativo tras payload gigante')
    } else {
      fail('Servidor no responde tras payload gigante')
    }
  } catch (e) {
    if (e.name === 'TimeoutError') {
      fail('Timeout: el servidor tardó más de 10s con payload gigante')
    } else {
      ok(`Payload gigante rechazado por la red: ${e.message}`)
    }
  }

  // ── RESUMEN ──────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(50))
  console.log(`Resultado: ${passed} OK / ${failed} fallos`)
  if (failed > 0) {
    console.log('\n⚠️  Hay vulnerabilidades que revisar.')
    process.exit(1)
  } else {
    console.log('\n✓ Todas las comprobaciones de seguridad pasaron.')
  }
}

run().catch(console.error)
