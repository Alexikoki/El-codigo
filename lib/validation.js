import { z } from 'zod'
import { NextResponse } from 'next/server'

// ── Esquemas reutilizables ──────────────────────────────────────

export const idSchema = z.string().uuid('ID no válido')

export const lugarSchema = z.object({
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

export const lugarUpdateSchema = z.object({
  id: idSchema,
  nombre: z.string().min(1).max(100).optional(),
  descuento: z.coerce.number().int().min(0).max(100).optional(),
  porcentaje_plataforma: z.coerce.number().min(0).max(100).optional(),
  barrio: z.string().max(60).optional(),
  activo: z.boolean().optional(),
})

export const referidorSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio').max(80),
  email: z.string().min(1, 'Email obligatorio').max(100),
  password: z.string().min(6, 'Contraseña mínimo 6 caracteres'),
  agencia_id: z.string().uuid().optional().nullable(),
})

export const staffSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio').max(80),
  email: z.string().min(1, 'Email obligatorio').max(100),
  password: z.string().min(6, 'Contraseña mínimo 6 caracteres'),
  lugar_id: z.string().uuid('Local no válido'),
})

export const agenciaSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio').max(100),
  email: z.string().email('Email no válido'),
  password: z.string().min(6, 'Contraseña mínimo 6 caracteres'),
})

export const liquidacionSchema = z.object({
  referidor_id: z.string().uuid('Referidor no válido'),
  importe: z.coerce.number().positive('Importe debe ser positivo'),
  periodo_desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha desde no válida'),
  periodo_hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha hasta no válida'),
  notas: z.string().max(500).optional().default(''),
})

export const liquidacionPatchSchema = z.object({
  id: idSchema,
  estado: z.enum(['pendiente', 'pagado']),
})

export const clienteUpdateSchema = z.object({
  id: idSchema,
  nombre: z.string().min(1).max(100).optional(),
  num_personas: z.coerce.number().int().min(1).max(50).optional(),
})

export const confirmarSchema = z.object({
  clienteId: idSchema,
  gasto: z.coerce.number().min(0, 'Gasto no puede ser negativo'),
  valoracion: z.coerce.number().int().min(1).max(5).optional(),
})

export const registroSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio').max(100),
  email: z.string().email('Email no válido'),
  num_personas: z.coerce.number().int().min(1).max(50).default(1),
  lugar_id: z.string().uuid('Local no válido'),
  referidor_id: z.string().uuid('Referidor no válido'),
  turnstileToken: z.string().min(1, 'Captcha requerido'),
})

export const loginSchema = z.object({
  email: z.string().min(1, 'Email obligatorio').max(200),
  password: z.string().min(1, 'Contraseña obligatoria').max(200),
  tipo: z.string().optional().default('staff'),
  cfToken: z.string().optional().default(''),
  totpCode: z.string().length(6).regex(/^\d{6}$/).optional(),
  rememberMe: z.boolean().optional().default(false),
})

export const confirmarCodigoSchema = z.object({
  clienteId: idSchema,
  codigo: z.string().length(5, 'Código debe ser de 5 dígitos').regex(/^\d{5}$/, 'Código debe ser numérico'),
})

export const registroEmpresaSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio').max(100),
  email: z.string().email('Email no válido'),
  password: z.string().min(6, 'Contraseña mínimo 6 caracteres'),
  tipo: z.string().min(1, 'Tipo obligatorio'),
})

// ── Helper para validar y devolver error 400 si falla ───────────

/**
 * Valida un body JSON contra un esquema Zod.
 * @returns {{ data: T } | { response: NextResponse }}
 */
export function validateBody(body, schema) {
  const result = schema.safeParse(body)
  if (!result.success) {
    const firstError = result.error.errors[0]?.message || 'Datos no válidos'
    return { response: NextResponse.json({ error: firstError }, { status: 400 }) }
  }
  return { data: result.data }
}
