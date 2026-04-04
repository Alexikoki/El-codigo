-- Habilitar RLS en tablas internas (acceso solo via service_role desde servidor)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

-- Fijar search_path en limpiar_rate_limits para evitar search path injection
ALTER FUNCTION public.limpiar_rate_limits() SET search_path = public;
