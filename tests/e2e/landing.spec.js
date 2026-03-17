import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test('carga correctamente y muestra elementos clave', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/El Código/)
    await expect(page.getByRole('banner').getByText('El Código', { exact: true })).toBeVisible()
    await expect(page.getByText('automatizado e inteligente')).toBeVisible()
    await expect(page.getByRole('link', { name: /Empezar ahora/i })).toBeVisible()
  })

  test('links legales funcionan', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Aviso Legal' }).click()
    await expect(page).toHaveURL('/aviso-legal')
    await expect(page.getByRole('heading', { name: 'Aviso Legal', level: 1 })).toBeVisible()
  })

  test('link Privacidad funciona', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Privacidad' }).click()
    await expect(page).toHaveURL('/privacidad')
  })

  test('página 404 personalizada', async ({ page }) => {
    await page.goto('/ruta-que-no-existe-xyz')
    await expect(page.getByText('404')).toBeVisible()
    await expect(page.getByText('Página no encontrada')).toBeVisible()
    await expect(page.getByRole('link', { name: /Volver al inicio/i })).toBeVisible()
  })
})
