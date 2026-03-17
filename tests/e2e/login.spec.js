import { test, expect } from '@playwright/test'

test.describe('Login', () => {
  test('muestra el formulario correctamente', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Accede a tu panel')).toBeVisible()
    await expect(page.getByPlaceholder(/email/i)).toBeVisible()
    await expect(page.getByPlaceholder(/contraseña/i)).toBeVisible()
  })

  test('muestra error con credenciales incorrectas', async ({ page }) => {
    await page.goto('/login')

    await page.getByPlaceholder(/email/i).fill('noexiste@test.com')
    await page.getByPlaceholder(/contraseña/i).fill('passwordmalo123')

    // Bypass Turnstile en test (el botón submit sin Turnstile mostrará error de captcha)
    await page.getByRole('button', { name: /Entrar/i }).click()

    // Debe mostrar algún error (captcha o credenciales)
    await expect(page.locator('text=/error|captcha|credenciales|seguridad/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('redirección a login desde panel protegido', async ({ page }) => {
    // Sin cookie de sesión, acceder a /superadmin debe redirigir a /login
    await page.goto('/superadmin')
    await expect(page).toHaveURL('/login', { timeout: 8000 })
  })

  test('redirección a login desde panel agencia sin sesión', async ({ page }) => {
    await page.goto('/agencia')
    await expect(page).toHaveURL('/login', { timeout: 8000 })
  })

  test('redirección a login desde panel manager sin sesión', async ({ page }) => {
    await page.goto('/manager')
    await expect(page).toHaveURL('/login', { timeout: 8000 })
  })
})
