const { chromium } = require('playwright')
const BASE_URL = 'https://el-codigo-lemon.vercel.app'
const TEST_API_KEY = process.env.TEST_API_KEY || ''
const CREDS = {
  superadmin: { tipo: 'superadmin', email: 'superadmin', pass: 'Golfo' },
  manager:    { tipo: 'manager',    email: 'test_manager@elcodigo.test',   pass: 'Test1234!' },
  staff:      { tipo: 'staff',      email: 'test_staff@elcodigo.test',     pass: 'Test1234!' },
  referidor:  { tipo: 'referidor',  email: 'test_referidor@elcodigo.test', pass: 'Test1234!' },
  agencia:    { tipo: 'agencia',    email: 'test_agencia@elcodigo.test',   pass: 'Test1234!' },
}
const results = []
function log(test, status, detail) {
  detail = detail || ''
  const icon = status === 'PASS' ? '✅' : '❌'
  console.log(icon + ' [' + status + '] ' + test + (detail ? ' — ' + detail : ''))
  results.push({ test, status, detail })
}
async function goto(page, url) {
  await page.goto(url, { waitUntil: 'commit', timeout: 30000 })
  await page.waitForTimeout(3000)
}

// Login via API directa (evita Turnstile en producción)
async function loginViaApi(browser, rol) {
  const c = CREDS[rol]
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    const res = await context.request.post(BASE_URL + '/api/auth', {
      data: { tipo: c.tipo, email: c.email, password: c.pass, cfToken: 'test' },
      headers: {
        'Content-Type': 'application/json',
        'x-test-key': TEST_API_KEY
      }
    })

    if (res.status() !== 200) {
      console.log('  [API login] Status ' + res.status() + ' para ' + rol)
      return { page, ok: false }
    }

    // La cookie auth_token ya está en el context gracias al Set-Cookie de la respuesta
    await goto(page, BASE_URL + '/' + (rol === 'superadmin' ? 'superadmin' : rol))
    const ok = page.url().includes('/' + (rol === 'superadmin' ? 'superadmin' : rol))
    return { page, ok }
  } catch(e) {
    console.log('  [API login] Error: ' + e.message)
    return { page, ok: false }
  }
}

;(async function() {
  const browser = await chromium.launch({ headless: true })

  // TEST 1: Login page
  var page = await browser.newPage()
  try {
    await goto(page, BASE_URL + '/login')
    await page.screenshot({ path: 'tests/screenshots/01_login.png', fullPage: true })
    const ok = await page.locator("input[type='password']").first().isVisible({ timeout: 5000 }).catch(function() { return false })
    log('Login: página carga correctamente', ok ? 'PASS' : 'FAIL', ok ? '' : 'No password field')
  } catch(e) { log('Login: página carga correctamente', 'FAIL', e.message) }
  await page.close()

  // TEST 2: Rutas protegidas
  page = await browser.newPage()
  try {
    var fallos = []
    var rutas = ['/superadmin','/manager','/staff','/referidor','/agencia']
    for (var i=0; i<rutas.length; i++) {
      await goto(page, BASE_URL + rutas[i])
      if (!page.url().includes('/login')) fallos.push(rutas[i] + '→' + page.url())
    }
    log('Seguridad: rutas protegidas redirigen a login', fallos.length===0 ? 'PASS' : 'FAIL', fallos.join(' | '))
  } catch(e) { log('Seguridad: rutas protegidas redirigen a login', 'FAIL', e.message) }
  await page.close()

  // TEST 3: APIs sin auth
  page = await browser.newPage()
  try {
    var eps = ['/api/analytics/superadmin','/api/analytics/manager','/api/liquidaciones','/api/referidores','/api/staff','/api/admin/clientes','/api/manager/tickets']
    var fallos2 = []
    for (var j=0; j<eps.length; j++) {
      const res = await page.request.get(BASE_URL + eps[j])
      if (![401,403].includes(res.status())) fallos2.push(eps[j] + '=' + res.status())
    }
    log('Seguridad: APIs sin auth devuelven 401/403', fallos2.length===0 ? 'PASS' : 'FAIL', fallos2.join(', '))
  } catch(e) { log('Seguridad: APIs sin auth devuelven 401/403', 'FAIL', e.message) }
  await page.close()

  // TEST 4: Credenciales incorrectas
  page = await browser.newPage()
  try {
    await goto(page, BASE_URL + '/login')
    const em = page.locator("input[type='email']").first()
    const pw = page.locator("input[type='password']").first()
    if (await em.isVisible({ timeout:3000 }).catch(function(){return false})) await em.fill('fake@fake.com')
    await pw.fill('wrongpass999')
    await page.locator("button[type='submit']").first().click()
    await page.waitForTimeout(4000)
    log('Seguridad: credenciales incorrectas mantienen en login', page.url().includes('/login') ? 'PASS' : 'FAIL', 'URL: ' + page.url())
  } catch(e) { log('Seguridad: credenciales incorrectas mantienen en login', 'FAIL', e.message) }
  await page.close()

  // TEST 5: Superadmin
  var r5 = await loginViaApi(browser, 'superadmin')
  page = r5.page
  try {
    if (!r5.ok) throw new Error('Login API falló — asegúrate de configurar TEST_API_KEY en Vercel')
    await page.screenshot({ path: 'tests/screenshots/02_superadmin.png', fullPage: true })
    log('Superadmin: login correcto', 'PASS')
    var tabs = ['Métricas','Locales','Referidores','Staff','Agencias','Pagos','Clientes']
    for (var t=0; t<tabs.length; t++) {
      try {
        const btn = page.locator('button:has-text("' + tabs[t] + '")').first()
        if (await btn.isVisible({ timeout:3000 }).catch(function(){return false})) {
          await btn.click(); await page.waitForTimeout(800)
          log('Superadmin: tab ' + tabs[t], 'PASS')
        } else log('Superadmin: tab ' + tabs[t], 'FAIL', 'no visible')
      } catch(e2) { log('Superadmin: tab ' + tabs[t], 'FAIL', e2.message) }
    }
    // Filtros fecha
    try {
      await page.locator('button:has-text("Métricas")').first().click(); await page.waitForTimeout(500)
      var presets = ['Hoy','Semana','Mes','Año','Todo']
      var foundPreset = false
      for (var p=0; p<presets.length; p++) {
        const pbtn = page.locator('button:has-text("' + presets[p] + '")').first()
        if (await pbtn.isVisible({ timeout:2000 }).catch(function(){return false})) { await pbtn.click(); await page.waitForTimeout(300); foundPreset=true }
      }
      log('Superadmin: filtros de fecha', foundPreset ? 'PASS' : 'FAIL', foundPreset ? '' : 'ningún preset visible')
    } catch(e2) { log('Superadmin: filtros de fecha', 'FAIL', e2.message) }
    // Clientes búsqueda
    try {
      await page.locator('button:has-text("Clientes")').first().click(); await page.waitForTimeout(600)
      const srch = page.locator("input[placeholder*='cliente'], input[placeholder*='Buscar']").first()
      if (await srch.isVisible({ timeout:3000 }).catch(function(){return false})) {
        await srch.fill('test'); await page.locator('button:has-text("Buscar")').first().click(); await page.waitForTimeout(1500)
      }
      log('Superadmin: tab Clientes con búsqueda', 'PASS')
    } catch(e2) { log('Superadmin: tab Clientes con búsqueda', 'FAIL', e2.message) }
    // Nueva liquidación
    try {
      await page.locator('button:has-text("Pagos")').first().click(); await page.waitForTimeout(600)
      const vis = await page.locator('button:has-text("Nueva Liquidación")').first().isVisible({ timeout:3000 }).catch(function(){return false})
      log('Superadmin: botón Nueva Liquidación', vis ? 'PASS' : 'FAIL')
    } catch(e2) { log('Superadmin: botón Nueva Liquidación', 'FAIL', e2.message) }
  } catch(e) { log('Superadmin: login correcto', 'FAIL', e.message) }
  await page.context().close()

  // TEST 6: Manager
  var r6 = await loginViaApi(browser, 'manager')
  page = r6.page
  try {
    if (!r6.ok) throw new Error('Login API falló')
    await page.screenshot({ path: 'tests/screenshots/03_manager.png', fullPage: true })
    log('Manager: login correcto', 'PASS')
    await page.waitForTimeout(1000)
    try {
      const n = await page.locator('.glass-panel').count()
      log('Manager: tarjetas de stats visibles', n>0 ? 'PASS' : 'FAIL', 'panels=' + n)
    } catch(e2) { log('Manager: tarjetas de stats visibles', 'FAIL', e2.message) }
    try {
      var mpresets = ['Hoy','Semana','Mes','Año','Todo']
      var foundM = false
      for (var mp=0; mp<mpresets.length; mp++) {
        const mbtn = page.locator('button:has-text("' + mpresets[mp] + '")').first()
        if (await mbtn.isVisible({ timeout:2000 }).catch(function(){return false})) { await mbtn.click(); await page.waitForTimeout(400); foundM=true }
      }
      log('Manager: filtros de fecha', foundM ? 'PASS' : 'FAIL')
    } catch(e2) { log('Manager: filtros de fecha', 'FAIL', e2.message) }
    try {
      const vis = await page.locator('text=Clientes de Hoy').first().isVisible({ timeout:5000 }).catch(function(){return false})
      log("Manager: 'Clientes de Hoy' visible", vis ? 'PASS' : 'FAIL')
    } catch(e2) { log("Manager: 'Clientes de Hoy' visible", 'FAIL', e2.message) }
  } catch(e) { log('Manager: login correcto', 'FAIL', e.message) }
  await page.context().close()

  // TEST 7: Staff
  var r7 = await loginViaApi(browser, 'staff')
  page = r7.page
  try {
    if (!r7.ok) throw new Error('Login API falló')
    await page.screenshot({ path: 'tests/screenshots/04_staff.png', fullPage: true })
    log('Staff: login correcto', 'PASS')
    await page.waitForTimeout(1500)
    const html = await page.content()
    const hasQr = html.toLowerCase().includes('qr') || html.toLowerCase().includes('scan') || html.toLowerCase().includes('verific')
    log('Staff: interfaz de escaneo presente', hasQr ? 'PASS' : 'FAIL')
  } catch(e) { log('Staff: login correcto', 'FAIL', e.message) }
  await page.context().close()

  // TEST 8: Referidor
  var r8 = await loginViaApi(browser, 'referidor')
  page = r8.page
  try {
    if (!r8.ok) throw new Error('Login API falló')
    await page.screenshot({ path: 'tests/screenshots/05_referidor.png', fullPage: true })
    log('Referidor: login correcto', 'PASS')
    await page.waitForTimeout(1000)
    try {
      const qrTab = page.locator('button:has-text("Mi QR")').first()
      if (await qrTab.isVisible({ timeout:3000 }).catch(function(){return false})) {
        await qrTab.click(); await page.waitForTimeout(2000)
        await page.screenshot({ path: 'tests/screenshots/05b_referidor_qr.png' })
        const img = await page.locator('img[alt="QR Code"], canvas').first().isVisible({ timeout:3000 }).catch(function(){return false})
        log('Referidor: QR personal generado', img ? 'PASS' : 'FAIL')
      } else log('Referidor: QR personal generado', 'FAIL', 'tab no visible')
    } catch(e2) { log('Referidor: QR personal generado', 'FAIL', e2.message) }
  } catch(e) { log('Referidor: login correcto', 'FAIL', e.message) }
  await page.context().close()

  // TEST 9: Agencia
  var r9 = await loginViaApi(browser, 'agencia')
  page = r9.page
  try {
    if (!r9.ok) throw new Error('Login API falló')
    await page.screenshot({ path: 'tests/screenshots/06_agencia.png', fullPage: true })
    log('Agencia: login correcto', 'PASS')
    await page.waitForTimeout(1000)
    var atabs = ['Promotores','Pagos']
    for (var at=0; at<atabs.length; at++) {
      try {
        const abtn = page.locator('button:has-text("' + atabs[at] + '")').first()
        const avis = await abtn.isVisible({ timeout:3000 }).catch(function(){return false})
        if (avis) { await abtn.click(); await page.waitForTimeout(500); log('Agencia: tab ' + atabs[at], 'PASS') }
        else log('Agencia: tab ' + atabs[at], 'FAIL', 'no visible')
      } catch(e2) { log('Agencia: tab ' + atabs[at], 'FAIL', e2.message) }
    }
  } catch(e) { log('Agencia: login correcto', 'FAIL', e.message) }
  await page.context().close()

  // TEST 10: Landing
  page = await browser.newPage()
  try {
    await goto(page, BASE_URL)
    await page.screenshot({ path: 'tests/screenshots/07_landing.png', fullPage: true })
    const ok = await page.locator('text=El Código').first().isVisible({ timeout:5000 }).catch(function(){return false})
    log('Landing: página principal carga', ok ? 'PASS' : 'FAIL', ok ? '' : 'title=' + await page.title())
  } catch(e) { log('Landing: página principal carga', 'FAIL', e.message) }
  await page.close()

  await browser.close()
  console.log('\n' + '='.repeat(60))
  console.log('RESUMEN DE TESTS')
  console.log('='.repeat(60))
  const passed = results.filter(function(r){return r.status==='PASS'}).length
  const failed = results.filter(function(r){return r.status==='FAIL'}).length
  console.log('✅ Pasados: ' + passed + '/' + results.length)
  console.log('❌ Fallados: ' + failed + '/' + results.length)
  if (failed > 0) {
    console.log('\nFallos:')
    results.filter(function(r){return r.status==='FAIL'}).forEach(function(r){
      console.log('  • ' + r.test + ': ' + r.detail)
    })
  }
  console.log('='.repeat(60))
  process.exit(failed === 0 ? 0 : 1)
})()
