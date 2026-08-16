BEGIN;

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.crm_current_user_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT usuario.id
  FROM public.usuarios AS usuario
  WHERE usuario.auth_user_id = (SELECT auth.uid())
    AND usuario.estado = 'ACTIVO'
    AND (
      usuario.rol NOT IN ('SUPER_ADMIN', 'ADMIN')
      OR COALESCE((SELECT auth.jwt() ->> 'aal'), '') = 'aal2'
    )
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION private.crm_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT usuario.rol
  FROM public.usuarios AS usuario
  WHERE usuario.auth_user_id = (SELECT auth.uid())
    AND usuario.estado = 'ACTIVO'
    AND (
      usuario.rol NOT IN ('SUPER_ADMIN', 'ADMIN')
      OR COALESCE((SELECT auth.jwt() ->> 'aal'), '') = 'aal2'
    )
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION private.crm_current_user_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
  SELECT lower(usuario.email)
  FROM public.usuarios AS usuario
  WHERE usuario.auth_user_id = (SELECT auth.uid())
    AND usuario.estado = 'ACTIVO'
    AND (
      usuario.rol NOT IN ('SUPER_ADMIN', 'ADMIN')
      OR COALESCE((SELECT auth.jwt() ->> 'aal'), '') = 'aal2'
    )
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION private.crm_current_user_id()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.crm_current_user_role()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.crm_current_user_email()
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION private.crm_current_user_id()
  TO authenticated;
GRANT EXECUTE ON FUNCTION private.crm_current_user_role()
  TO authenticated;
GRANT EXECUTE ON FUNCTION private.crm_current_user_email()
  TO authenticated;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON TABLE
  public.leads,
  public.documentos,
  public.tareas,
  public.comisiones
TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON TABLE
  public.leads,
  public.documentos,
  public.tareas,
  public.comisiones
FROM authenticated;

DROP POLICY IF EXISTS crm_leads_read ON public.leads;
CREATE POLICY crm_leads_read
ON public.leads
FOR SELECT
TO authenticated
USING (
  (SELECT private.crm_current_user_role()) IN (
    'SUPER_ADMIN',
    'ADMIN',
    'EJECUTIVO'
  )
  OR (
    (SELECT private.crm_current_user_role()) = 'AGENTE'
    AND asignadoa = (SELECT private.crm_current_user_id())
  )
  OR (
    (SELECT private.crm_current_user_role()) = 'CLIENTE'
    AND lower(email) = (SELECT private.crm_current_user_email())
  )
);

DROP POLICY IF EXISTS crm_documentos_read ON public.documentos;
CREATE POLICY crm_documentos_read
ON public.documentos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.leads AS lead_permitido
    WHERE lead_permitido.id = documentos.leadid
  )
);

DROP POLICY IF EXISTS crm_tareas_read ON public.tareas;
CREATE POLICY crm_tareas_read
ON public.tareas
FOR SELECT
TO authenticated
USING (
  (SELECT private.crm_current_user_role()) IN (
    'SUPER_ADMIN',
    'ADMIN',
    'EJECUTIVO'
  )
  OR (
    (SELECT private.crm_current_user_role()) = 'AGENTE'
    AND asignadoa = (SELECT private.crm_current_user_id())
  )
);

DROP POLICY IF EXISTS crm_comisiones_read ON public.comisiones;
CREATE POLICY crm_comisiones_read
ON public.comisiones
FOR SELECT
TO authenticated
USING (
  (SELECT private.crm_current_user_role()) IN ('SUPER_ADMIN', 'ADMIN')
);

COMMIT;
