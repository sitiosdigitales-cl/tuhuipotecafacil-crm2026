-- Idempotencia del correo entrante. Solo conserva un hash irreversible del
-- remitente + Message-ID y el lead resultante; nunca almacena asunto o cuerpo.

CREATE TABLE IF NOT EXISTS public.correos_entrantes (
  mensaje_hash TEXT PRIMARY KEY,
  estado TEXT NOT NULL DEFAULT 'PROCESANDO',
  lead_id TEXT REFERENCES public.leads(id) ON DELETE SET NULL,
  creadoen TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  actualizadoen TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT correos_entrantes_hash_check
    CHECK (mensaje_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT correos_entrantes_estado_check
    CHECK (estado IN ('PROCESANDO', 'COMPLETADO')),
  CONSTRAINT correos_entrantes_completado_check
    CHECK (estado <> 'COMPLETADO' OR lead_id IS NOT NULL)
);

ALTER TABLE public.correos_entrantes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.correos_entrantes
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.reclamar_correo_entrante(
  p_mensaje_hash TEXT,
  p_ventana_segundos INTEGER DEFAULT 900
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  reclamada BOOLEAN := false;
BEGIN
  IF p_mensaje_hash IS NULL OR p_mensaje_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'El hash del correo no es válido'
      USING ERRCODE = 'P0001';
  END IF;
  IF p_ventana_segundos IS NULL OR p_ventana_segundos < 0 THEN
    RAISE EXCEPTION 'La ventana del correo no puede ser negativa'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.correos_entrantes (mensaje_hash)
  VALUES (p_mensaje_hash)
  ON CONFLICT (mensaje_hash) DO UPDATE
  SET actualizadoen = clock_timestamp()
  WHERE correos_entrantes.estado = 'PROCESANDO'
    AND correos_entrantes.actualizadoen
      < clock_timestamp() - make_interval(secs => p_ventana_segundos)
  RETURNING true INTO reclamada;

  RETURN COALESCE(reclamada, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.completar_correo_entrante(
  p_mensaje_hash TEXT,
  p_lead_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  completada BOOLEAN := false;
BEGIN
  UPDATE public.correos_entrantes
  SET
    estado = 'COMPLETADO',
    lead_id = p_lead_id,
    actualizadoen = clock_timestamp()
  WHERE mensaje_hash = p_mensaje_hash
    AND estado = 'PROCESANDO'
  RETURNING true INTO completada;

  IF COALESCE(completada, false) THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.correos_entrantes
    WHERE mensaje_hash = p_mensaje_hash
      AND estado = 'COMPLETADO'
      AND lead_id = p_lead_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.liberar_correo_entrante(
  p_mensaje_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  liberada BOOLEAN := false;
BEGIN
  DELETE FROM public.correos_entrantes
  WHERE mensaje_hash = p_mensaje_hash
    AND estado = 'PROCESANDO'
    AND lead_id IS NULL
  RETURNING true INTO liberada;

  RETURN COALESCE(liberada, false);
END;
$$;

REVOKE ALL ON FUNCTION public.reclamar_correo_entrante(TEXT, INTEGER)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.completar_correo_entrante(TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.liberar_correo_entrante(TEXT)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.reclamar_correo_entrante(TEXT, INTEGER)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.completar_correo_entrante(TEXT, TEXT)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.liberar_correo_entrante(TEXT)
  TO service_role;

