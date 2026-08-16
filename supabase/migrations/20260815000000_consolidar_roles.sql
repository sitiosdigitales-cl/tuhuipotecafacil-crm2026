-- SEC-07 · Consolidación de roles
--
-- El rol GERENTE desaparece y sus cuentas pasan a ADMIN. Quedan cinco:
--
--   SUPER_ADMIN  control total. El único que administra roles.
--   ADMIN        el antiguo GERENTE. Todas las vistas del dashboard, ve y
--                edita datos, pero no puede crear usuarios ni cambiar roles.
--   EJECUTIVO    comercial. Ve todos los leads y clientes.
--   AGENTE       contraparte del banco. Lee documentos de las solicitudes.
--   CLIENTE      solo su propio perfil y sus documentos.
--
-- Ejecutar en Supabase Dashboard > SQL Editor ANTES de desplegar el código:
-- una vez desplegado, el tipo Rol ya no incluye GERENTE y una cuenta con ese
-- valor en la base queda sin coincidir con ninguna regla de permisos.

-- Cuántas cuentas se van a migrar
SELECT rol, COUNT(*) AS cuentas
FROM usuarios
GROUP BY rol
ORDER BY rol;

-- La migración
UPDATE usuarios
SET rol = 'ADMIN'
WHERE rol = 'GERENTE';

-- Comprobación: no debe quedar ninguna fila
SELECT COUNT(*) AS gerentes_restantes
FROM usuarios
WHERE rol = 'GERENTE';

-- Estado final
SELECT rol, COUNT(*) AS cuentas
FROM usuarios
GROUP BY rol
ORDER BY rol;
