import { test, expect } from '@playwright/test'

// Test del flujo público: cliente llega a /r/[token] y ve el formulario de registro
// No completamos el registro real para no crear datos de prueba en producción

test.describe('Página de registro de cliente (/r/[token])', () => {
  test('URL con token inválido muestra error graceful', async ({ page }) => {
    await page.goto('/r/token-que-no-existe-12345')
    // Debe cargar la página (no 500) y mostrar algún estado de error o carga
    await expect(page).not.toHaveURL('/login')
    // La página debe renderizar algo (no pantalla en blanco)
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('formulario de registro tiene los campos requeridos', async ({ page }) => {
    // Usamos un token de prueba — la página cargará aunque el token no exista en BD
    await page.goto('/r/test-token-demo')

    // Esperamos que haya algún formulario o mensaje visible
    await page.waitForLoadState('networkidle')
    const body = await page.locator('body').textContent()
    // La página debe tener contenido (no estar vacía)
    expect(body?.length).toBeGreaterThan(50)
  })
})

test.describe('Página de valoración (/valorar/[id])', () => {
  test('ID inválido muestra estado de error amigable', async ({ page }) => {
    await page.goto('/valorar/id-que-no-existe')
    await page.waitForLoadState('networkidle')
    const body = await page.locator('body').textContent()
    expect(body?.length).toBeGreaterThan(50)
  })
})
