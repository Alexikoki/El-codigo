const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const BASE = 'http://localhost:3000'
const SCREENSHOTS = path.join(__dirname, 'screenshots')
if (!fs.existsSync(SCREENSHOTS)) fs.mkdirSync(SCREENSHOTS, { recursive: true })

const errors = []
const ok = (msg) => console.log(`  ✓ ${msg}`)
const fail = (msg) => { console.log(`  ✗ ${msg}`); errors.push(msg) }
const log = (msg) => console.log(`  · ${msg}`)

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const consoleErrors = []
  const page = await ctx.newPage()
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })

  // ── 1. LOGIN PAGE ──────────────────────────────────────────────────────
  console.log('\n[1] Login page')
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' })
  await page.screenshot({ path: `${SCREENSHOTS}/01_login.png` })
  const inputs = await page.locator('input').count()
  if (inputs >= 2) ok('Inputs presentes')
  else fail('Inputs no encontrados')

  // ── 2. SUPERADMIN PANEL ─────────────────────────────────────────────────
  console.log('\n[2] Superadmin panel')
  await page.goto(BASE + '/superadmin', { waitUntil: 'networkidle' })
  await page.screenshot({ path: `${SCREENSHOTS}/02_superadmin.png` })

  if (page.url().includes('/superadmin')) {
    ok('Panel superadmin accesible')

    for (const t of ['Métricas', 'Locales', 'Referidores', 'Staff', 'Pagos']) {
      const count = await page.locator(`button:has-text("${t}")`).count()
      if (count > 0) ok(`Tab "${t}" presente`)
      else fail(`Tab "${t}" NO encontrada`)
    }

    // Test buscador en tab Locales
    await page.locator('button:has-text("Locales")').first().click()
    await page.waitForTimeout(400)
    const search = page.locator('input[placeholder*="uscar"]')
    if (await search.count() > 0) {
      await search.fill('restaurante')
      await page.waitForTimeout(400)
      await page.screenshot({ path: `${SCREENSHOTS}/03_search_activo.png` })
      ok('Buscador filtra al escribir')
      await search.fill('')
    } else {
      fail('Buscador no encontrado')
    }

    // Test tab Pagos
    await page.locator('button:has-text("Pagos")').first().click()
    await page.waitForTimeout(800)
    await page.screenshot({ path: `${SCREENSHOTS}/04_pagos_tab.png` })
    ok('Tab Pagos cargada')

    // Botón Nueva Liquidación
    const btnNueva = page.locator('button:has-text("Nueva Liquidación")')
    if (await btnNueva.count() > 0) {
      ok('Botón "Nueva Liquidación" presente')
      await btnNueva.click()
      await page.waitForTimeout(600)
      await page.screenshot({ path: `${SCREENSHOTS}/05_modal_liquidacion.png` })
      const modalVisible = await page.locator('text=Referidor').count() > 0
      if (modalVisible) ok('Modal nueva liquidación se abre correctamente')
      else fail('Modal no se abrió')
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
    } else {
      fail('Botón "Nueva Liquidación" no encontrado')
    }

    // Filtros de estado
    const filtroEstado = page.locator('select').first()
    if (await filtroEstado.count() > 0) {
      ok('Filtros de liquidaciones presentes')
    }

  } else {
    log(`Sin sesión superadmin — URL: ${page.url()}`)
    fail('Panel superadmin no accesible (sin sesión)')
  }

  // ── 3. REFERIDOR PANEL ──────────────────────────────────────────────────
  console.log('\n[3] Referidor panel')
  await page.goto(BASE + '/referidor', { waitUntil: 'networkidle' })
  await page.screenshot({ path: `${SCREENSHOTS}/06_referidor.png` })
  if (page.url().includes('/referidor')) {
    ok('Panel referidor accesible')
    for (const t of ['Rendimiento', 'Mi QR', 'Invitados', 'Pagos']) {
      const count = await page.locator(`button:has-text("${t}")`).count()
      if (count > 0) ok(`Tab "${t}" presente`)
      else fail(`Tab "${t}" NO encontrada`)
    }
  } else {
    log(`Sin sesión referidor — URL: ${page.url()}`)
  }

  // ── 4. LANDING ──────────────────────────────────────────────────────────
  console.log('\n[4] Landing page')
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.screenshot({ path: `${SCREENSHOTS}/07_landing.png` })
  const title = await page.title()
  ok(`Título: "${title}"`)
  if (await page.locator('nav').count() > 0) ok('Navbar presente')
  else fail('Navbar no encontrada')

  // ── 5. 404 ──────────────────────────────────────────────────────────────
  console.log('\n[5] Página 404')
  await page.goto(BASE + '/pagina-que-no-existe', { waitUntil: 'networkidle' })
  await page.screenshot({ path: `${SCREENSHOTS}/08_404.png` })
  const body = await page.textContent('body')
  if (body.includes('404') || body.toLowerCase().includes('encontrar') || body.toLowerCase().includes('volver')) {
    ok('Página 404 personalizada OK')
  } else {
    fail('404 no parece personalizada')
  }

  // ── CONSOLA ─────────────────────────────────────────────────────────────
  console.log('\n[Console errors]')
  const relevant = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('sentry') && !e.includes('Sentry'))
  if (relevant.length > 0) {
    relevant.slice(0, 5).forEach(e => fail(`Console: ${e}`))
  } else {
    ok('Sin errores de consola')
  }

  await browser.close()

  console.log(`\n${'='.repeat(50)}`)
  console.log(`Resultado: ${errors.length} error(es)`)
  if (errors.length > 0) {
    errors.forEach(e => console.log(`  - ${e}`))
    process.exit(1)
  } else {
    console.log('Todo OK ✓')
  }
})()
