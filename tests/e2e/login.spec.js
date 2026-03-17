import { test, expect } from '@playwright/test'

test.describe('Login', () => {
  test('muestra el formulario correctamente', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Acceso seguro al sistema')).toBeVisible()
    await expect(page.getByPlaceholder('Usuario o correo electrónico')).toBeVisible()
    await expect(page.getByPlaceholder('Contraseña')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Acceder al panel' })).toBeVisible()
  })

  test('muestra error con credenciales incorrectas', async ({ page }) => {
    await page.goto('/login')

    await page.getByPlaceholder('Usuario o correo electrónico').fill('noexiste@test.com')
    await page.getByPlaceholder('Contraseña').fill('passwordmalo123')
    await page.getByRole('button', { name: 'Acceder al panel' }).click()

    // Debe mostrar error (captcha o credenciales)
    await expect(page.locator('[class*=red], [class*=error]').first()).toBeVisible({ timeout: 5000 })
  })

  test('redirección a login desde panel protegido', async ({ page }) => {
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
