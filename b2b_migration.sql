-- ==============================================================================
-- FASE 6: MIGRACIÓN B2B Y SISTEMA SPLIT DE COMISIONES ("EL CÓDIGO")
-- Ejecutar en el SQL Editor de Supabase
-- ==============================================================================

-- 1. TABLA: AGENCIAS (Tour Operators)
CREATE TABLE IF NOT EXISTS public.agencias (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    porcentaje_split DECIMAL(5,2) DEFAULT 30.00, -- Ej: la agencia se queda el 30% de la comisión
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS Default-Deny
ALTER TABLE public.agencias ENABLE ROW LEVEL SECURITY;

-- 2. TABLA: MANAGERS (Dueños de Locales B2B)
CREATE TABLE IF NOT EXISTS public.managers_locales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    lugar_id UUID REFERENCES public.lugares(id) ON DELETE CASCADE,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS Default-Deny
ALTER TABLE public.managers_locales ENABLE ROW LEVEL SECURITY;

-- 3. MODIFICACIÓN: REFERIDORES (Añadir subordinación y split individual)
ALTER TABLE public.referidores 
ADD COLUMN IF NOT EXISTS agencia_id UUID REFERENCES public.agencias(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS porcentaje_split DECIMAL(5,2) DEFAULT 50.00; -- Ej: él se queda el 50%, la plataforma el resto (o la agencia)

-- 4. MODIFICACIÓN: LUGARES (Añadir porcentaje plataforma por defecto)
ALTER TABLE public.lugares
ADD COLUMN IF NOT EXISTS porcentaje_plataforma DECIMAL(5,2) DEFAULT 20.00; -- Ej: El Código le cobra un 20% de cada ticket al Local

-- 5. MODIFICACIÓN: VALORACIONES (Registro inmutable del Flow del Dinero)
-- Cuando se inserta un ticket, congelaremos las métricas de quién cobró qué para no depender de rateos dinámicos en los PDFs
ALTER TABLE public.valoraciones
ADD COLUMN IF NOT EXISTS comision_lugar DECIMAL(10,2) DEFAULT 0.00,       -- (Gasto * porcentaje_plataforma) -> Lo que el Bar le debe pagar a El Código
ADD COLUMN IF NOT EXISTS comision_agencia DECIMAL(10,2) DEFAULT 0.00,     -- (comision_lugar * agencia.porcentaje_split) -> Lo que El Código le ingresa a la Agencia
ADD COLUMN IF NOT EXISTS comision_referidor DECIMAL(10,2) DEFAULT 0.00;   -- (comision_lugar * referidor.porcentaje_split) -> Lo que le cae al RRPP

-- ==============================================================================
-- NOTA: RLS Policy. Al igual que el resto, NextJS supabaseAdmin se saltará 
-- el bloqueo. La consulta desde Vercel o desde navegadores anon será dropeada.
-- ==============================================================================
