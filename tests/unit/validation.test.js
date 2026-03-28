import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { z } from 'zod'

// Re-define schemas inline to avoid importing NextResponse from next/server
// These must match lib/validation.js exactly
const idSchema = z.string().uuid('ID no válido')
const loginSchema = z.object({
  email: z.string().min(1, 'Email obligatorio').max(200),
  password: z.string().min(1, 'Contraseña obligatoria').max(200),
  tipo: z.string().optional(),
  cfToken: z.string().min(1, 'Falta token de seguridad (Turnstile)'),
})
const confirmarCodigoSchema = z.object({
  clienteId: idSchema,
  codigo: z.string().length(5, 'Código debe ser de 5 dígitos').regex(/^\d{5}$/, 'Código debe ser numérico'),
})
const lugarSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio').max(100),
  tipo: z.enum(['Restaurante', 'Bar', 'Club', 'Hotel', 'Turismo', 'Experiencia'], { message: 'Tipo no válido' }),
  direccion: z.string().min(1, 'Dirección obligatoria').max(200),
  barrio: z.string().max(60).optional().default(''),
  descuento: z.coerce.number().int().min(0).max(100).default(10),
  porcentaje_plataforma: z.coerce.number().min(0).max(100).default(20),
  manager_nombre: z.string().min(1, 'Nombre del manager obligatorio').max(80),
  manager_email: z.string().email('Email del manager no válido'),
  manager_password: z.string().min(6, 'Contraseña mínimo 6 caracteres'),
})
const referidorSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio').max(80),
  email: z.string().min(1, 'Email obligatorio').max(100),
  password: z.string().min(6, 'Contraseña mínimo 6 caracteres'),
  agencia_id: z.string().uuid().optional().nullable(),
})
const liquidacionSchema = z.object({
  referidor_id: z.string().uuid('Referidor no válido'),
  importe: z.coerce.number().positive('Importe debe ser positivo'),
  periodo_desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha desde no válida'),
  periodo_hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha hasta no válida'),
  notas: z.string().max(500).optional().default(''),
})
const registroEmpresaSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio').max(100),
  email: z.string().email('Email no válido'),
  password: z.string().min(6, 'Contraseña mínimo 6 caracteres'),
  tipo: z.string().min(1, 'Tipo obligatorio'),
})

describe('idSchema', () => {
  it('acepta UUID válido', () => {
    const r = idSchema.safeParse('00000000-0000-0000-0000-000000000000')
    assert.ok(r.success)
  })
  it('rechaza string no UUID', () => {
    const r = idSchema.safeParse('no-es-uuid')
    assert.ok(!r.success)
  })
  it('rechaza vacío', () => {
    const r = idSchema.safeParse('')
    assert.ok(!r.success)
  })
})

describe('loginSchema', () => {
  it('acepta login válido', () => {
    const r = loginSchema.safeParse({ email: 'test@test.com', password: '123456', cfToken: 'tok' })
    assert.ok(r.success)
  })
  it('rechaza sin email', () => {
    const r = loginSchema.safeParse({ password: '123456', cfToken: 'tok' })
    assert.ok(!r.success)
  })
  it('rechaza sin cfToken', () => {
    const r = loginSchema.safeParse({ email: 'test@test.com', password: '123456' })
    assert.ok(!r.success)
  })
  it('rechaza email vacío', () => {
    const r = loginSchema.safeParse({ email: '', password: '123456', cfToken: 'tok' })
    assert.ok(!r.success)
  })
  it('acepta tipo opcional', () => {
    const r = loginSchema.safeParse({ email: 'a@b.c', password: 'x', cfToken: 't', tipo: 'staff' })
    assert.ok(r.success)
    assert.equal(r.data.tipo, 'staff')
  })
})

describe('confirmarCodigoSchema', () => {
  it('acepta código válido de 5 dígitos', () => {
    const r = confirmarCodigoSchema.safeParse({
      clienteId: '00000000-0000-0000-0000-000000000000',
      codigo: '12345'
    })
    assert.ok(r.success)
  })
  it('rechaza código de 3 dígitos', () => {
    const r = confirmarCodigoSchema.safeParse({
      clienteId: '00000000-0000-0000-0000-000000000000',
      codigo: '123'
    })
    assert.ok(!r.success)
  })
  it('rechaza código con letras', () => {
    const r = confirmarCodigoSchema.safeParse({
      clienteId: '00000000-0000-0000-0000-000000000000',
      codigo: 'abcde'
    })
    assert.ok(!r.success)
  })
  it('rechaza clienteId no UUID', () => {
    const r = confirmarCodigoSchema.safeParse({ clienteId: 'bad', codigo: '12345' })
    assert.ok(!r.success)
  })
})

describe('lugarSchema', () => {
  const validLugar = {
    nombre: 'Bar Test', tipo: 'Bar', direccion: 'Calle 1',
    manager_nombre: 'Manager', manager_email: 'mgr@test.com', manager_password: '123456'
  }
  it('acepta lugar válido', () => {
    const r = lugarSchema.safeParse(validLugar)
    assert.ok(r.success)
    assert.equal(r.data.descuento, 10) // default
    assert.equal(r.data.porcentaje_plataforma, 20) // default
  })
  it('rechaza tipo inválido', () => {
    const r = lugarSchema.safeParse({ ...validLugar, tipo: 'Casino' })
    assert.ok(!r.success)
  })
  it('rechaza descuento > 100', () => {
    const r = lugarSchema.safeParse({ ...validLugar, descuento: 150 })
    assert.ok(!r.success)
  })
  it('rechaza password corta del manager', () => {
    const r = lugarSchema.safeParse({ ...validLugar, manager_password: '12' })
    assert.ok(!r.success)
  })
})

describe('referidorSchema', () => {
  it('acepta referidor válido', () => {
    const r = referidorSchema.safeParse({ nombre: 'Juan', email: 'j@t.com', password: '123456' })
    assert.ok(r.success)
  })
  it('rechaza sin nombre', () => {
    const r = referidorSchema.safeParse({ email: 'j@t.com', password: '123456' })
    assert.ok(!r.success)
  })
  it('acepta agencia_id opcional', () => {
    const r = referidorSchema.safeParse({
      nombre: 'Juan', email: 'j@t.com', password: '123456',
      agencia_id: '00000000-0000-0000-0000-000000000000'
    })
    assert.ok(r.success)
  })
})

describe('liquidacionSchema', () => {
  it('acepta liquidación válida', () => {
    const r = liquidacionSchema.safeParse({
      referidor_id: '00000000-0000-0000-0000-000000000000',
      importe: 150.50,
      periodo_desde: '2026-01-01',
      periodo_hasta: '2026-01-31'
    })
    assert.ok(r.success)
  })
  it('rechaza importe negativo', () => {
    const r = liquidacionSchema.safeParse({
      referidor_id: '00000000-0000-0000-0000-000000000000',
      importe: -10,
      periodo_desde: '2026-01-01',
      periodo_hasta: '2026-01-31'
    })
    assert.ok(!r.success)
  })
  it('rechaza fecha mal formateada', () => {
    const r = liquidacionSchema.safeParse({
      referidor_id: '00000000-0000-0000-0000-000000000000',
      importe: 100,
      periodo_desde: '01-01-2026',
      periodo_hasta: '2026-01-31'
    })
    assert.ok(!r.success)
  })
})

describe('registroEmpresaSchema', () => {
  it('acepta registro válido', () => {
    const r = registroEmpresaSchema.safeParse({
      nombre: 'Empresa', email: 'e@t.com', password: '123456', tipo: 'bar'
    })
    assert.ok(r.success)
  })
  it('rechaza password < 6 chars', () => {
    const r = registroEmpresaSchema.safeParse({
      nombre: 'Empresa', email: 'e@t.com', password: '12', tipo: 'bar'
    })
    assert.ok(!r.success)
  })
  it('rechaza email inválido', () => {
    const r = registroEmpresaSchema.safeParse({
      nombre: 'Empresa', email: 'no-email', password: '123456', tipo: 'bar'
    })
    assert.ok(!r.success)
  })
})

// validateBody depends on NextResponse so we test the equivalent logic inline
describe('validateBody equivalent', () => {
  function validateBody(body, schema) {
    const result = schema.safeParse(body)
    if (!result.success) {
      const issues = result.error.issues || result.error.errors || []
      return { error: issues[0]?.message || 'Datos no válidos' }
    }
    return { data: result.data }
  }
  it('retorna data con input válido', () => {
    const result = validateBody({ email: 'a@b.c', password: 'x', cfToken: 't' }, loginSchema)
    assert.ok(result.data)
    assert.ok(!result.error)
  })
  it('retorna error con input inválido', () => {
    const result = validateBody({}, loginSchema)
    assert.ok(result.error)
    assert.ok(!result.data)
  })
})
