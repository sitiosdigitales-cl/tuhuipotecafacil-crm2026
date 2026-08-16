# Checklist operacional del CRM

Este documento distingue lo comprobado por el repositorio de las acciones que
requieren cuentas, secretos o decisiones humanas. Una casilla de código no
certifica por sí sola el entorno productivo.

## Verificado en código y CI

- [x] `npm run build`, `npm test`, `npm run lint` y `npm run typecheck`.
- [x] `npm audit --audit-level=high` sin alertas vigentes.
- [x] Supabase local se reconstruye dos veces desde `supabase/migrations/`.
- [x] Las reglas SQL se comprueban con pgTAP mediante `npm run db:test`.
- [x] El respaldo externo genera roles, esquema, datos y objetos con hashes.
- [x] El ensayo de restauración rechaza destinos no vacíos y mide el RTO.
- [x] El SQL histórico `prisma/run-all-pending.sql` se detiene sin ejecutar.

## P0 · Antes de aplicar migraciones administradas

- [ ] Recuperar y probar dos cuentas `SUPER_ADMIN` independientes.
- [ ] Rotar `JWT_SECRET`, `BACKUP_API_KEY` y `CRON_SECRET` en los gestores
  autorizados, sin copiar valores a documentos o tickets.
- [ ] Confirmar respaldo administrado o PITR del proyecto Supabase.
- [ ] Activar el respaldo R2 siguiendo `docs/respaldos-externos.md`.
- [ ] Restaurar un snapshot en un proyecto de staging vacío dentro de cuatro
  horas y registrar el resultado.
- [ ] Comparar un dump remoto **sin datos** con el baseline del repositorio y
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

- [ ] Crear o seleccionar un proyecto que no contenga datos reales.
- [ ] Confirmar que el snapshot externo se puede leer antes del cambio.
- [ ] Aplicar exactamente la cadena revisada de `supabase/migrations/` mediante
  la CLI y credenciales entregadas por una persona autorizada.
- [ ] Verificar login, roles, leads, solicitudes, documentos, comisiones,
  webhooks y buckets privados con datos sintéticos.
- [ ] Confirmar que `anon` y `authenticated` no leen las tablas cerradas.

### Producción

- [ ] Avanzar solo después de que staging, respaldo y recuperación estén
  verdes para el mismo commit.
- [ ] Abrir una ventana de cambio con responsable, reversión y observación.
- [ ] Aplicar las migraciones sin editar SQL desde el panel.
- [ ] Repetir smoke de roles y revisar errores sin consultar datos personales.

**Staging siempre va antes que producción.** Codex no ejecuta estos pasos ni
confirma casillas que dependan de paneles o secretos.

## Servicios externos

- [ ] Configurar R2, Restic y notificaciones de fallos de respaldo.
- [ ] Configurar el environment protegido `staging-restore` con revisores.
- [ ] Verificar dominio, SPF, DKIM y DMARC para Resend.
- [ ] Ejecutar envío real desde staging a una dirección sintética controlada.
- [ ] Verificar webhooks con firmas y datos sintéticos de cada proveedor.

## Autenticación y acceso

- [ ] Completar la migración gradual a Supabase Auth.
- [ ] Replicar en staging la configuración versionada de Auth, incluido
  `jwt_expiry = 900`, y confirmar el valor efectivo antes de habilitar
  `SUPABASE_AUTH_MODE=bridge`.
- [ ] Exigir MFA a `SUPER_ADMIN` y `ADMIN`.
- [ ] Probar revocación, recuperación y cambio de rol por solicitud.
- [ ] Verificar RLS por dominio con la matriz completa de roles.

Estas casillas continúan abiertas hasta tener evidencia en staging; que la suite
local esté verde no reemplaza esa verificación.
