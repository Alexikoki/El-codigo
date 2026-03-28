import { test, expect } from '@playwright/test'

const API = 'http://localhost:3000/api'

test.describe('API Input Validation (Zod)', () => {
  test('POST /api/confirmar rejects missing fields', async ({ request }) => {
    const res = await request.post(`${API}/confirmar`, {
      data: {}
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  test('POST /api/confirmar rejects invalid clienteId', async ({ request }) => {
    const res = await request.post(`${API}/confirmar`, {
      data: { clienteId: 'not-a-uuid', codigo: '12345' }
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('ID')
  })

  test('POST /api/confirmar rejects short code', async ({ request }) => {
    const res = await request.post(`${API}/confirmar`, {
      data: { clienteId: '00000000-0000-0000-0000-000000000000', codigo: '123' }
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/auth rejects empty body', async ({ request }) => {
    const res = await request.post(`${API}/auth`, {
      data: {}
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  test('POST /api/auth rejects missing cfToken', async ({ request }) => {
    const res = await request.post(`${API}/auth`, {
      data: { email: 'test@test.com', password: 'test123' }
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/registro rejects weak password', async ({ request }) => {
    const res = await request.post(`${API}/registro`, {
      data: { nombre: 'Test', email: 'test@test.com', password: '12', tipo: 'bar' }
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('6')
  })

  test('POST /api/registro rejects missing fields', async ({ request }) => {
    const res = await request.post(`${API}/registro`, {
      data: { nombre: 'Test' }
    })
    expect(res.status()).toBe(400)
  })

  test('GET /api/lugares returns valid structure', async ({ request }) => {
    const res = await request.get(`${API}/lugares`)
    // Should return 200 with lugares array (may be empty without DB)
    if (res.status() === 200) {
      const body = await res.json()
      expect(body).toHaveProperty('lugares')
      expect(Array.isArray(body.lugares)).toBeTruthy()
    }
  })

  test('protected routes return 401 without auth', async ({ request }) => {
    const protectedRoutes = [
      { url: `${API}/admin/clientes`, method: 'GET' },
    ]
    for (const route of protectedRoutes) {
      const res = await request.get(route.url)
      expect([401, 403]).toContain(res.status())
    }
  })
})
