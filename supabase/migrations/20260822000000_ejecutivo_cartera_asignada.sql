-- PIPELINE-V4 · La cartera de un ejecutivo deja de ser compartida.
-- Administración conserva visión global; EJECUTIVO y AGENTE solo ven filas
-- cuyo asignadoa coincide con la cuenta CRM de la sesión.

DROP POLICY IF EXISTS crm_leads_read ON public.leads;
CREATE POLICY crm_leads_read
ON public.leads
FOR SELECT
TO authenticated
USING (
  (SELECT private.crm_current_user_role()) IN ('SUPER_ADMIN', 'ADMIN')
  OR (
    (SELECT private.crm_current_user_role()) IN ('EJECUTIVO', 'AGENTE')
    AND asignadoa = (SELECT private.crm_current_user_id())
  )
  OR (
    (SELECT private.crm_current_user_role()) = 'CLIENTE'
    AND lower(email) = (SELECT private.crm_current_user_email())
  )
);
