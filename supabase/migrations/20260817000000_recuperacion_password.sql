-- Control de frecuencia del correo de recuperación.
--
-- El formulario responde igual exista o no la cuenta, así que quien lo repita
-- no recibe señal alguna: sin esta marca, repetirlo con el correo de alguien
-- del equipo le llena el buzón sin costo. La reserva se hace en el mismo UPDATE
-- que la comprueba porque dos peticiones simultáneas leerían el mismo valor.

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS recuperacion_enviada_en TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.reclamar_recuperacion_password(
  p_usuario_id TEXT,
  p_espera_segundos INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  reclamada BOOLEAN := false;
BEGIN
  IF p_espera_segundos IS NULL OR p_espera_segundos < 0 THEN
    RAISE EXCEPTION 'La espera de recuperación no puede ser negativa'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.usuarios
  SET recuperacion_enviada_en = clock_timestamp()
  WHERE id = p_usuario_id
    AND estado = 'ACTIVO'
    AND auth_user_id IS NOT NULL
    AND (
      recuperacion_enviada_en IS NULL
      OR recuperacion_enviada_en
         < clock_timestamp() - make_interval(secs => p_espera_segundos)
    )
  RETURNING true INTO reclamada;

  RETURN COALESCE(reclamada, false);
END;
$$;

REVOKE ALL ON FUNCTION public.reclamar_recuperacion_password(TEXT, INTEGER)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.reclamar_recuperacion_password(TEXT, INTEGER)
  TO service_role;
