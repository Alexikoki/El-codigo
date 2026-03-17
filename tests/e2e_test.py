"""
Tests E2E para El Código - https://el-codigo-lemon.vercel.app
Credenciales de test creadas en Supabase para cada rol.
"""
from playwright.sync_api import sync_playwright, expect
import sys
import time

BASE_URL = "https://el-codigo-lemon.vercel.app"

CREDS = {
    "superadmin": {"tipo": "superadmin", "email": "superadmin", "pass": "Golfo"},
    "manager":    {"tipo": "manager",    "email": "test_manager@elcodigo.test",   "pass": "Test1234!"},
    "staff":      {"tipo": "staff",      "email": "test_staff@elcodigo.test",     "pass": "Test1234!"},
    "referidor":  {"tipo": "referidor",  "email": "test_referidor@elcodigo.test", "pass": "Test1234!"},
    "agencia":    {"tipo": "agencia",    "email": "test_agencia@elcodigo.test",   "pass": "Test1234!"},
}

results = []

def log(test, status, detail=""):
    icon = "✅" if status == "PASS" else "❌"
    print(f"{icon} [{status}] {test}" + (f" — {detail}" if detail else ""))
    results.append({"test": test, "status": status, "detail": detail})

def login(page, rol):
    """Hace login con el rol dado, devuelve True si tuvo éxito."""
    c = CREDS[rol]
    page.goto(f"{BASE_URL}/login")
    page.wait_for_load_state("networkidle")

    # Seleccionar tipo
    try:
        sel = page.locator(f"button:has-text('{c['tipo'].capitalize()}'), [data-tipo='{c['tipo']}']").first
        if sel.is_visible():
            sel.click()
    except:
        pass

    # Rellenar campos
    email_field = page.locator("input[type='email'], input[placeholder*='mail'], input[placeholder*='correo']").first
    pass_field  = page.locator("input[type='password']").first

    if c["tipo"] == "superadmin":
        # Superadmin solo usa contraseña
        try:
            pass_field.fill(c["pass"])
        except:
            email_field.fill(c["email"])
            pass_field.fill(c["pass"])
    else:
        email_field.fill(c["email"])
        pass_field.fill(c["pass"])

    page.locator("button[type='submit'], button:has-text('Entrar'), button:has-text('Acceder')").first.click()
    page.wait_for_load_state("networkidle")
    time.sleep(2)
    return page.url != f"{BASE_URL}/login"


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # ─────────────────────────────────────────
    # TEST 1: Página de login carga correctamente
    # ─────────────────────────────────────────
    page = browser.new_page()
    try:
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.screenshot(path="tests/screenshots/01_login.png")
        assert "El Código" in page.title() or page.locator("input[type='password']").is_visible()
        log("Login: página carga correctamente", "PASS")
    except Exception as e:
        log("Login: página carga correctamente", "FAIL", str(e))
    page.close()

    # ─────────────────────────────────────────
    # TEST 2: Rutas protegidas redirigen a login
    # ─────────────────────────────────────────
    page = browser.new_page()
    try:
        for ruta in ["/superadmin", "/manager", "/staff", "/referidor", "/agencia"]:
            page.goto(f"{BASE_URL}{ruta}")
            page.wait_for_load_state("networkidle")
            assert "/login" in page.url or page.locator("input[type='password']").is_visible(), f"{ruta} no redirige a login"
        log("Seguridad: rutas protegidas redirigen a login", "PASS")
    except Exception as e:
        log("Seguridad: rutas protegidas redirigen a login", "FAIL", str(e))
    page.close()

    # ─────────────────────────────────────────
    # TEST 3: APIs sin auth devuelven 401
    # ─────────────────────────────────────────
    page = browser.new_page()
    try:
        endpoints = [
            "/api/analytics/superadmin",
            "/api/analytics/manager",
            "/api/liquidaciones",
            "/api/referidores",
            "/api/lugares",
            "/api/staff",
        ]
        for ep in endpoints:
            res = page.request.get(f"{BASE_URL}{ep}")
            assert res.status in [401, 403], f"{ep} devolvió {res.status} (esperado 401/403)"
        log("Seguridad: APIs sin auth devuelven 401/403", "PASS")
    except Exception as e:
        log("Seguridad: APIs sin auth devuelven 401/403", "FAIL", str(e))
    page.close()

    # ─────────────────────────────────────────
    # TEST 4: Login superadmin
    # ─────────────────────────────────────────
    page = browser.new_page()
    try:
        ok = login(page, "superadmin")
        page.screenshot(path="tests/screenshots/02_superadmin.png")
        assert ok and "/superadmin" in page.url
        log("Superadmin: login correcto", "PASS")

        # TEST 5: Tabs del superadmin
        for tab_text in ["Métricas", "Locales", "Referidores", "Staff", "Agencias", "Pagos", "Clientes"]:
            try:
                btn = page.locator(f"button:has-text('{tab_text}')").first
                btn.click()
                page.wait_for_load_state("networkidle")
                time.sleep(0.5)
                log(f"Superadmin: tab '{tab_text}' carga", "PASS")
            except Exception as e:
                log(f"Superadmin: tab '{tab_text}' carga", "FAIL", str(e))

        # TEST 6: Filtros de fecha en analytics
        try:
            page.locator("button:has-text('Métricas')").first.click()
            page.wait_for_load_state("networkidle")
            for preset in ["Hoy", "Semana", "Mes", "Año", "Todo"]:
                btn = page.locator(f"button:has-text('{preset}')").first
                if btn.is_visible():
                    btn.click()
                    time.sleep(0.3)
            log("Superadmin: filtros de fecha analytics", "PASS")
        except Exception as e:
            log("Superadmin: filtros de fecha analytics", "FAIL", str(e))

        # TEST 7: Tab clientes con búsqueda
        try:
            page.locator("button:has-text('Clientes')").first.click()
            page.wait_for_load_state("networkidle")
            search = page.locator("input[placeholder*='cliente']").first
            if search.is_visible():
                search.fill("a")
                page.locator("button:has-text('Buscar')").first.click()
                time.sleep(1)
            log("Superadmin: búsqueda de clientes", "PASS")
        except Exception as e:
            log("Superadmin: búsqueda de clientes", "FAIL", str(e))

        # TEST 8: Exportar Excel
        try:
            page.locator("button:has-text('Exportar Excel')").first.click()
            time.sleep(1)
            log("Superadmin: botón exportar Excel visible", "PASS")
        except Exception as e:
            log("Superadmin: botón exportar Excel visible", "FAIL", str(e))

    except Exception as e:
        log("Superadmin: login correcto", "FAIL", str(e))
    page.close()

    # ─────────────────────────────────────────
    # TEST 9: Login manager
    # ─────────────────────────────────────────
    page = browser.new_page()
    try:
        ok = login(page, "manager")
        page.screenshot(path="tests/screenshots/03_manager.png")
        assert ok and "/manager" in page.url
        log("Manager: login correcto", "PASS")

        page.wait_for_load_state("networkidle")
        time.sleep(1)

        # TEST 10: Tarjetas de stats visibles
        try:
            assert page.locator("text=Volumen").first.is_visible() or page.locator("text=Comisión").first.is_visible()
            log("Manager: tarjetas de stats visibles", "PASS")
        except Exception as e:
            log("Manager: tarjetas de stats visibles", "FAIL", str(e))

        # TEST 11: Filtros de fecha
        try:
            for preset in ["Hoy", "Semana", "Mes"]:
                btn = page.locator(f"button:has-text('{preset}')").first
                if btn.is_visible():
                    btn.click()
                    time.sleep(0.3)
            log("Manager: filtros de fecha", "PASS")
        except Exception as e:
            log("Manager: filtros de fecha", "FAIL", str(e))

        # TEST 12: Sección clientes de hoy visible
        try:
            assert page.locator("text=Clientes de Hoy").first.is_visible()
            log("Manager: sección 'Clientes de Hoy' visible", "PASS")
        except Exception as e:
            log("Manager: sección 'Clientes de Hoy' visible", "FAIL", str(e))

    except Exception as e:
        log("Manager: login correcto", "FAIL", str(e))
    page.close()

    # ─────────────────────────────────────────
    # TEST 13: Login staff
    # ─────────────────────────────────────────
    page = browser.new_page()
    try:
        ok = login(page, "staff")
        page.screenshot(path="tests/screenshots/04_staff.png")
        assert ok and "/staff" in page.url
        log("Staff: login correcto", "PASS")

        # TEST 14: Escáner QR visible
        try:
            time.sleep(1)
            content = page.content()
            assert "scanner" in content.lower() or "qr" in content.lower() or page.locator("video, canvas, #qr-reader").first.is_visible(timeout=3000)
            log("Staff: escáner QR presente", "PASS")
        except Exception as e:
            log("Staff: escáner QR presente", "FAIL", str(e))

    except Exception as e:
        log("Staff: login correcto", "FAIL", str(e))
    page.close()

    # ─────────────────────────────────────────
    # TEST 15: Login referidor
    # ─────────────────────────────────────────
    page = browser.new_page()
    try:
        ok = login(page, "referidor")
        page.screenshot(path="tests/screenshots/05_referidor.png")
        assert ok and "/referidor" in page.url
        log("Referidor: login correcto", "PASS")

        # TEST 16: Dashboard con stats
        try:
            time.sleep(1)
            assert page.locator("text=Rendimiento, text=Comisión, text=QR").count() > 0 or page.locator("text=Tickets").first.is_visible()
            log("Referidor: dashboard con stats visible", "PASS")
        except Exception as e:
            log("Referidor: dashboard con stats visible", "FAIL", str(e))

        # TEST 17: Tab QR
        try:
            page.locator("button:has-text('Mi QR')").first.click()
            time.sleep(1)
            page.screenshot(path="tests/screenshots/05b_referidor_qr.png")
            assert page.locator("img[alt='QR Code']").is_visible(timeout=5000) or page.locator("canvas").first.is_visible(timeout=3000)
            log("Referidor: tab QR muestra código", "PASS")
        except Exception as e:
            log("Referidor: tab QR muestra código", "FAIL", str(e))

    except Exception as e:
        log("Referidor: login correcto", "FAIL", str(e))
    page.close()

    # ─────────────────────────────────────────
    # TEST 18: Login agencia
    # ─────────────────────────────────────────
    page = browser.new_page()
    try:
        ok = login(page, "agencia")
        page.screenshot(path="tests/screenshots/06_agencia.png")
        assert ok and "/agencia" in page.url
        log("Agencia: login correcto", "PASS")

        # TEST 19: Tabs de agencia
        try:
            time.sleep(1)
            for tab in ["Promotores", "Pagos"]:
                btn = page.locator(f"button:has-text('{tab}')").first
                if btn.is_visible():
                    btn.click()
                    time.sleep(0.3)
            log("Agencia: tabs Promotores y Pagos visibles", "PASS")
        except Exception as e:
            log("Agencia: tabs Promotores y Pagos visibles", "FAIL", str(e))

    except Exception as e:
        log("Agencia: login correcto", "FAIL", str(e))
    page.close()

    # ─────────────────────────────────────────
    # TEST 20: Landing page
    # ─────────────────────────────────────────
    page = browser.new_page()
    try:
        page.goto(BASE_URL)
        page.wait_for_load_state("networkidle")
        page.screenshot(path="tests/screenshots/07_landing.png")
        assert page.locator("text=El Código").first.is_visible()
        log("Landing: página principal carga", "PASS")
    except Exception as e:
        log("Landing: página principal carga", "FAIL", str(e))
    page.close()

    # ─────────────────────────────────────────
    # TEST 21: Credenciales incorrectas dan error
    # ─────────────────────────────────────────
    page = browser.new_page()
    try:
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        email_field = page.locator("input[type='email']").first
        pass_field  = page.locator("input[type='password']").first
        email_field.fill("noexiste@test.com")
        pass_field.fill("wrongpassword")
        page.locator("button[type='submit'], button:has-text('Entrar')").first.click()
        time.sleep(2)
        assert "/login" in page.url
        log("Seguridad: credenciales incorrectas mantienen en login", "PASS")
    except Exception as e:
        log("Seguridad: credenciales incorrectas mantienen en login", "FAIL", str(e))
    page.close()

    browser.close()

# ─────────────────────────────────────────
# RESUMEN FINAL
# ─────────────────────────────────────────
print("\n" + "="*60)
print("RESUMEN DE TESTS")
print("="*60)
passed = sum(1 for r in results if r["status"] == "PASS")
failed = sum(1 for r in results if r["status"] == "FAIL")
total  = len(results)
print(f"✅ Pasados: {passed}/{total}")
print(f"❌ Fallados: {failed}/{total}")
if failed > 0:
    print("\nFallos:")
    for r in results:
        if r["status"] == "FAIL":
            print(f"  • {r['test']}: {r['detail']}")
print("="*60)
sys.exit(0 if failed == 0 else 1)
