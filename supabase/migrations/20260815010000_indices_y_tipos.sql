-- Optimización de la base: índices para las consultas que el código hace hoy,
-- y corrección del choque de tipos que tiene rotas las notificaciones.
--
-- Ejecutar en Supabase Dashboard > SQL Editor.
-- Todo es idempotente y no destructivo; se puede correr dos veces.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. ÍNDICES SOBRE `leads`
-- ═══════════════════════════════════════════════════════════════════════════
--
-- `leads` es la tabla más consultada del sistema y no tiene un solo índice.
-- Cada listado hace un recorrido completo. Con cientos de filas no se nota;
-- con 40 vendedores consultando en paralelo, sí.
--
-- CONCURRENTLY para no bloquear escrituras mientras se construyen. Si el
-- editor SQL de Supabase no lo permite dentro de una transacción, quitar la
-- palabra: con el volumen actual la construcción es de milisegundos.

-- El alcance por rol del AGENTE filtra por esta columna en cada listado.
CREATE INDEX IF NOT EXISTS idx_leads_asignadoa ON leads(asignadoa);

-- El alcance del CLIENTE y el portal resuelven la solicitud por correo.
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(lower(email));

-- Filtro del pipeline.
CREATE INDEX IF NOT EXISTS idx_leads_etapa ON leads(etapa);

-- Orden por defecto de todos los listados.
CREATE INDEX IF NOT EXISTS idx_leads_creadoen ON leads(creadoen DESC);

-- Compuesto: es la consulta exacta del AGENTE, filtrar por dueño y ordenar por
-- fecha. Un índice que cubre las dos cosas evita ordenar en memoria después.
CREATE INDEX IF NOT EXISTS idx_leads_asignadoa_creadoen ON leads(asignadoa, creadoen DESC);

-- Búsqueda por RUT.
CREATE INDEX IF NOT EXISTS idx_leads_rut ON leads(rut);


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. CHOQUE DE TIPOS EN `notificaciones`
-- ═══════════════════════════════════════════════════════════════════════════
--
-- `notificaciones.usuarioid` y `leadid` se declararon UUID, pero
-- `usuarios.id` y `leads.id` son TEXT. Insertar una notificación para el
-- usuario 'u1' falla siempre porque 'u1' no es un UUID válido.
--
-- Esta es la causa de los cinco commits seguidos de "debug: notificaciones"
-- que hay en el historial: se depuró el síntoma sin mirar el esquema.
--
-- Se convierte a TEXT, que es el tipo del resto del sistema. Los valores UUID
-- existentes sobreviven: un UUID siempre es un TEXT válido, al revés no.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notificaciones'
      AND column_name = 'usuarioid'
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE notificaciones ALTER COLUMN usuarioid TYPE TEXT USING usuarioid::text;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notificaciones'
      AND column_name = 'leadid'
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE notificaciones ALTER COLUMN leadid TYPE TEXT USING leadid::text;
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. ÍNDICES QUE FALTAN EN EL RESTO
-- ═══════════════════════════════════════════════════════════════════════════

-- El login busca por correo en cada intento.
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Las notificaciones se listan por usuario y por no leídas.
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_leida
  ON notificaciones(usuarioid, leida);

-- Los documentos se piden siempre por lead.
CREATE INDEX IF NOT EXISTS idx_documentos_leadid ON documentos(leadid);


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. COMPROBACIÓN
-- ═══════════════════════════════════════════════════════════════════════════

SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('leads', 'usuarios', 'documentos', 'notificaciones')
ORDER BY tablename, indexname;

-- Tipos de notificaciones: las dos deben decir "text"
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'notificaciones'
  AND column_name IN ('usuarioid', 'leadid');
