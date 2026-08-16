# Checklist operacional del CRM

Este documento distingue lo comprobado por el repositorio de las acciones que
requieren cuentas, secretos o decisiones humanas. Una casilla de código no
certifica por sí sola el entorno productivo.

Los identificadores, orden y evidencia exigida están en
`docs/staging-validacion.md`. Cada ejecución usa
`docs/evidencia-staging-plantilla.md`: una casilla no se marca solo por memoria,
captura aislada o resultado local.

## Verificado en código y CI

- [x] `npm run build`, `npm test`, `npm run lint` y `npm run typecheck`.
- [x] `npm audit --audit-level=high` sin alertas vigentes.
- [x] Supabase local se reconstruye dos veces desde `supabase/migrations/`.
- [x] Las reglas SQL se comprueban con pgTAP mediante `npm run db:test`.
- [x] CI consulta RLS por Data API con los cinco roles y datos sintéticos.
- [x] pgTAP comprueba 61 reglas de migración, Auth, Storage y RLS.
- [x] Los modos `legacy`, `bridge` y `required` están implementados y probados.
- [x] El puente enlaza cuentas, sincroniza su ciclo de vida y tiene fecha límite.
- [x] Access y refresh usan cookies HttpOnly; cada solicitud Supabase valida la
  identidad y la cuenta vigente antes de aceptar la sesión.
- [x] `SUPER_ADMIN` y `ADMIN` requieren TOTP/AAL2 antes de recibir sesión CRM.
- [x] El inventario de rutas API detecta métodos nuevos sin comprobación de
  sesión o excepción pública documentada.
- [x] El respaldo externo genera roles, esquema, datos y objetos con hashes.
- [x] El ensayo de restauración rechaza destinos no vacíos y mide el RTO.
- [x] El SQL histórico `prisma/run-all-pending.sql` se detiene sin ejecutar.

## P0 · Antes de aplicar migraciones administradas

- [ ] [`ADM-01`] Recuperar y probar dos cuentas `SUPER_ADMIN` independientes.
- [ ] [`SEC-01`] Rotar `JWT_SECRET`, `BACKUP_API_KEY` y `CRON_SECRET` en los gestores
  autorizados, sin copiar valores a documentos o tickets.
- [ ] [`BAK-01`] Confirmar respaldo administrado o PITR del proyecto Supabase.
- [ ] [`BAK-02`] Activar el respaldo R2 siguiendo `docs/respaldos-externos.md`.
- [ ] [`RES-01`] Restaurar un snapshot en `staging-restore` vacío dentro de cuatro
  horas y registrar el resultado.
- [ ] [`RES-02`] Eliminar o purgar el destino restaurado después del ensayo.
- [ ] [`DB-02`] Comparar un dump remoto **sin datos** con el baseline del repositorio y
  reconciliar cualquier deriva de forma aditiva.

## Migraciones

### Local

```bash
npm run db:start
npm run db:reset
npm run db:reset
npm run db:test
npm run db:stop
```

El procedimiento y las condiciones de detención están en
`docs/supabase-migrations.md`. No usar scripts de `prisma/` como instalador.

### Staging

- [ ] [`DB-01`] Crear `staging-validation` sin datos reales ni tablas de aplicación.
- [ ] [`BAK-02`] Confirmar que el snapshot externo se puede leer antes del cambio.
- [ ] [`DB-03`] Aplicar exactamente la cadena revisada de `supabase/migrations/` mediante
  la CLI y credenciales entregadas por una persona autorizada.
- [ ] [`APP-02`] Verificar login, roles, leads, solicitudes, documentos, comisiones,
  webhooks y buckets privados con datos sintéticos.
- [ ] [`RLS-01`] Confirmar que `anon` y `authenticated` no leen las tablas cerradas.

### Producción

- [ ] [`GO-01`] Avanzar solo después de que staging, respaldo y recuperación estén
  verdes para el mismo commit.
- [ ] [`GO-01`] Abrir una ventana de cambio con responsable, reversión y observación.
- [ ] [`GO-01`] Aplicar las migraciones sin editar SQL desde el panel.
- [ ] [`GO-01`] Repetir smoke de roles y revisar errores sin consultar datos personales.

**Staging siempre va antes que producción.** Codex no ejecuta estos pasos ni
confirma casillas que dependan de paneles o secretos.

## Servicios externos

- [ ] [`BAK-02`] Configurar R2, Restic y notificaciones de fallos de respaldo.
- [ ] [`RES-01`] Configurar el environment protegido `staging-restore` con revisores.
- [ ] [`AUTH-02`] Configurar el environment protegido `staging-validation`.
- [ ] [`MAIL-01`] Verificar dominio, SPF, DKIM y DMARC para Resend.
- [ ] [`MAIL-01`] Ejecutar envío real desde staging a una dirección sintética controlada.
- [ ] [`WEB-01`] Verificar webhooks con firmas y datos sintéticos de cada proveedor.
- [ ] [`CMF-01`] Configurar y verificar la API oficial CMF con trazabilidad de fecha y
  fuente, o mantener tasas e histórico en estado `SIN_DATOS`.

## Autenticación y acceso

- [ ] [`AUTH-01`] Definir `SUPABASE_AUTH_MODE=bridge` y una
  `SUPABASE_AUTH_BRIDGE_DEADLINE` de hasta 30 días en staging.
- [ ] [`AUTH-02`] Completar el puente y probar `SUPABASE_AUTH_MODE=required` antes de
  retirar el modo legado.
- [ ] [`AUTH-01`] Replicar en staging la configuración versionada de Auth, incluido
  `jwt_expiry = 900`, y confirmar el valor efectivo antes de habilitar
  `SUPABASE_AUTH_MODE=bridge`.
- [ ] [`AUTH-02`] Confirmar en staging que `SUPER_ADMIN` y `ADMIN` no entran al CRM sin
  TOTP/AAL2.
- [ ] [`AUTH-02`] Probar revocación y cambio de rol por solicitud con cuentas sintéticas.
- [ ] [`AUTH-04`] Implementar y probar recuperación de contraseña de autoservicio.
- [ ] [`AUTH-03`] Configurar protección contra contraseñas conocidas o documentar una
  alternativa equivalente.
- [ ] [`RLS-01`] Verificar RLS por dominio con la matriz completa de roles.

La matriz automatizada local/CI está documentada en
`docs/supabase-hardening.md`. Esta casilla permanece abierta hasta repetirla en
un proyecto de staging separado con el mismo commit.

Estas casillas continúan abiertas hasta tener evidencia en staging; que la suite
local esté verde no reemplaza esa verificación.
