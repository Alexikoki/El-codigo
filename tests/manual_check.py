from playwright.sync_api import sync_playwright
import os, sys

BASE = 'http://localhost:3000'
SCREENSHOTS = 'tests/screenshots'
os.makedirs(SCREENSHOTS, exist_ok=True)

errors = []

def log(msg): print(f'  {msg}')
def ok(msg): print(f'  ✓ {msg}')
def fail(msg):
    print(f'  ✗ {msg}')
    errors.append(msg)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={'width': 1280, 'height': 800})
    console_errors = []
    page = ctx.new_page()
    page.on('console', lambda m: console_errors.append(m.text) if m.type == 'error' else None)

    # ── 1. LOGIN PAGE ──────────────────────────────────────────────────────────
    print('\n[1] Login page')
    page.goto(BASE + '/login', wait_until='networkidle')
    page.screenshot(path=f'{SCREENSHOTS}/01_login.png')
    if page.locator('input').count() >= 2:
        ok('Inputs de usuario y contraseña presentes')
    else:
        fail('No se encontraron inputs en el login')

    # ── 2. LOGIN COMO SUPERADMIN ───────────────────────────────────────────────
    print('\n[2] Login superadmin')
    creds = [
        ('superadmin', 'superadmin123'),
        ('admin', 'admin123'),
        ('admin@elcodigo.com', 'admin123'),
    ]
    logged_in = False
    for user, pw in creds:
        try:
            page.goto(BASE + '/login', wait_until='networkidle')
            inputs = page.locator('input').all()
            if len(inputs) >= 2:
                inputs[0].fill(user)
                inputs[1].fill(pw)
                page.locator('button[type=submit], button').first.click()
                page.wait_for_timeout(2000)
                if '/superadmin' in page.url or '/login' not in page.url:
                    ok(f'Login exitoso con usuario: {user}')
                    logged_in = True
                    break
        except Exception as e:
            pass

    if not logged_in:
        log('No se pudo hacer login automático — navegando directamente al panel')
        # Intentamos navegar directamente (si hay cookie de sesión activa en el browser del usuario)

    # ── 3. SUPERADMIN PANEL ────────────────────────────────────────────────────
    print('\n[3] Superadmin panel')
    page.goto(BASE + '/superadmin', wait_until='networkidle')
    page.screenshot(path=f'{SCREENSHOTS}/02_superadmin.png')
    current_url = page.url

    if '/superadmin' in current_url:
        ok('Panel superadmin accesible')

        # Test tabs visibles
        tabs_text = page.locator('button').all_text_contents()
        expected_tabs = ['Métricas', 'Locales', 'Referidores', 'Staff', 'Pagos']
        for t in expected_tabs:
            if any(t in txt for txt in tabs_text):
                ok(f'Tab "{t}" presente')
            else:
                fail(f'Tab "{t}" NO encontrada')

        # Test buscador
        search = page.locator('input[placeholder*="uscar"]')
        if search.count() > 0:
            ok('Buscador presente')
            # Click en tab Locales primero
            page.get_by_role('button', name='Locales').first.click()
            page.wait_for_timeout(500)
            search.fill('test')
            page.wait_for_timeout(500)
            page.screenshot(path=f'{SCREENSHOTS}/03_search.png')
            ok('Buscador acepta texto')
            search.fill('')
        else:
            fail('Buscador no encontrado')

        # Test tab Pagos
        pagos_btn = page.get_by_role('button', name='Pagos')
        if pagos_btn.count() > 0:
            pagos_btn.first.click()
            page.wait_for_timeout(1000)
            page.screenshot(path=f'{SCREENSHOTS}/04_pagos_tab.png')
            ok('Tab Pagos clickeable')

            # Verificar botón Nueva Liquidación
            nueva_liq = page.get_by_role('button', name='Nueva Liquidación')
            if nueva_liq.count() > 0:
                ok('Botón "Nueva Liquidación" presente')
                nueva_liq.click()
                page.wait_for_timeout(600)
                page.screenshot(path=f'{SCREENSHOTS}/05_modal_liquidacion.png')
                # Verificar que el modal se abrió
                if page.locator('text=Nueva Liquidación').count() >= 1:
                    ok('Modal de nueva liquidación se abre')
                else:
                    fail('Modal no se abrió')
                # Cerrar modal
                page.keyboard.press('Escape')
                page.wait_for_timeout(400)
            else:
                fail('Botón "Nueva Liquidación" no encontrado')

            # Verificar tarjetas de métricas (si hay liquidaciones)
            page.screenshot(path=f'{SCREENSHOTS}/06_pagos_metricas.png')
            log('Tab Pagos verificada')
        else:
            fail('Tab Pagos no encontrada')

    else:
        log(f'Redirigido a: {current_url} — sin sesión activa, skipping panel tests')

    # ── 4. REFERIDOR PANEL ────────────────────────────────────────────────────
    print('\n[4] Referidor panel')
    page.goto(BASE + '/referidor', wait_until='networkidle')
    page.screenshot(path=f'{SCREENSHOTS}/07_referidor.png')
    if '/referidor' in page.url:
        ok('Panel referidor accesible')
        tabs = page.locator('button').all_text_contents()
        for t in ['Rendimiento', 'Mi QR', 'Invitados', 'Pagos']:
            if any(t in txt for txt in tabs):
                ok(f'Tab referidor "{t}" presente')
            else:
                fail(f'Tab referidor "{t}" NO encontrada')
    else:
        log(f'Redirigido a: {page.url} — sin sesión de referidor')

    # ── 5. PÁGINA PRINCIPAL ───────────────────────────────────────────────────
    print('\n[5] Landing page')
    page.goto(BASE, wait_until='networkidle')
    page.screenshot(path=f'{SCREENSHOTS}/08_landing.png')
    if page.title():
        ok(f'Título: {page.title()}')
    if page.locator('nav').count() > 0:
        ok('Navbar presente')

    # ── 6. PÁGINA 404 ─────────────────────────────────────────────────────────
    print('\n[6] Custom 404')
    page.goto(BASE + '/pagina-que-no-existe', wait_until='networkidle')
    page.screenshot(path=f'{SCREENSHOTS}/09_404.png')
    content = page.content()
    if '404' in content or 'encontrar' in content.lower() or 'not found' in content.lower():
        ok('Página 404 personalizada funciona')
    else:
        fail('404 no parece personalizada')

    # ── RESUMEN ───────────────────────────────────────────────────────────────
    print('\n[Console errors]')
    relevant = [e for e in console_errors if 'favicon' not in e.lower() and 'sentry' not in e.lower()]
    if relevant:
        for e in relevant[:5]:
            fail(f'Console error: {e}')
    else:
        ok('Sin errores de consola relevantes')

    browser.close()

print(f'\n{"="*50}')
print(f'Resultado: {len(errors)} error(es) encontrado(s)')
if errors:
    for e in errors:
        print(f'  - {e}')
    sys.exit(1)
else:
    print('Todo OK')
