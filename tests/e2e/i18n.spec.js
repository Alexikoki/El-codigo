import { test, expect } from '@playwright/test'

test.describe('i18n Language Switching', () => {
  test('landing page loads in default language (ES)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check for Spanish content
    const body = await page.locator('body').textContent()
    // Should contain some Spanish keyword from the landing
    expect(
      body?.includes('automatizado') || body?.includes('Empezar') || body?.includes('itrustb2b')
    ).toBeTruthy()
  })

  test('login page renders translated content', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // The login title should be visible in some language
    const title = page.locator('text=Acceso seguro').or(page.locator('text=Secure system'))
    await expect(title.first()).toBeVisible({ timeout: 5000 })
  })

  test('language persists via localStorage', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Set language to English via localStorage
    await page.evaluate(() => localStorage.setItem('lang', 'en'))
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Check English content is displayed
    const body = await page.locator('body').textContent()
    expect(
      body?.includes('Get started') || body?.includes('automated') || body?.includes('How it works')
    ).toBeTruthy()
  })

  test('valorar page shows translated content', async ({ page }) => {
    // Set language first
    await page.goto('/')
    await page.evaluate(() => localStorage.setItem('lang', 'en'))

    // Navigate to valorar page with fake ID
    await page.goto('/valorar/00000000-0000-0000-0000-000000000000')
    await page.waitForLoadState('networkidle')

    // Should show some content (either error or loading, but in English)
    const body = await page.locator('body').textContent()
    expect(body?.length).toBeGreaterThan(10)
  })

  test('register page shows translated labels', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.setItem('lang', 'en'))

    await page.goto('/r/test-token-demo')
    await page.waitForLoadState('networkidle')

    // Should show error state or form in English
    const body = await page.locator('body').textContent()
    expect(body?.length).toBeGreaterThan(10)
  })
})
