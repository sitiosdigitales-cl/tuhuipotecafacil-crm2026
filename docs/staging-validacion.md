# STG-01 · Validación operacional de staging

Este runbook convierte `docs/CHECKLIST-CONFIGURACION.md` en una secuencia con
criterios de aceptación y evidencia. No autoriza cambios productivos ni permite
guardar secretos o datos personales en el repositorio.

## Regla de marcado

Una casilla se marca únicamente cuando existe un registro con:

1. identificador de este documento;
2. commit completo desplegado;
3. fecha UTC y responsable;
4. comando o workflow ejecutado;
5. resultado esperado y observado;
6. enlace a evidencia sin secretos ni datos personales;
7. revisión de una segunda persona para gates `P0` y producción.

Una captura de configuración, un build local o “funcionó una vez” no reemplaza
estos campos. Usar `docs/evidencia-staging-plantilla.md` y conservar el registro
en el sistema operacional autorizado. Solo el resumen sin información sensible
puede enlazarse desde el checklist.

## Dos entornos distintos

### `staging-validation`

- Proyecto Supabase separado con datos exclusivamente sintéticos.
- Ejecuta migraciones, Auth, MFA, RLS, Storage y smoke de aplicación.
- Puede alojar el despliegue de staging del CRM.
- Nunca recibe una restauración de datos productivos.

### `staging-restore`

- Proyecto desechable, inicialmente vacío y protegido por revisores.
- Recibe el snapshot externo para comprobar recuperación y, por lo tanto,
  puede contener temporalmente datos reales restaurados.
- No se conecta al despliegue del CRM, no envía correos ni ejecuta webhooks.
- Se elimina o purga de forma verificada al terminar el ensayo.

No reutilizar un mismo proyecto para ambos propósitos. “Vacío” describe el
estado inicial del destino de restauración, no el contenido posterior.

## Matriz de gates

| ID | Criterio de aceptación | Evidencia mínima | Responsable |
| --- | --- | --- | --- |
| `REL-01` | Los seis jobs de CI terminan verdes para el SHA a desplegar | URL del run y SHA | ingeniería |
| `ADM-01` | Existen dos `SUPER_ADMIN` independientes y recuperables | acta de prueba sin correos ni nombres | responsable de acceso |
| `SEC-01` | Secretos operativos rotados en sus gestores | fecha, responsable y nombres de variables | responsable de plataforma |
| `BAK-01` | Backup administrado o PITR está activo | política, retención y hora del último punto | responsable Supabase |
| `BAK-02` | R2 guarda un snapshot cifrado reciente | run `External Backup` verde y antigüedad menor a 1 h | responsable de respaldo |
| `RES-01` | El snapshot restaura dentro de 14.400 s | run `Restore Drill`, duración y recuentos | operador + revisor |
| `RES-02` | El destino restaurado queda eliminado o purgado | fecha y aprobación de cierre | responsable Supabase |
| `DB-01` | `staging-validation` parte sin tablas de aplicación ni datos reales | recuento de tablas previo y declaración de datos sintéticos | operador |
| `DB-02` | El dry-run lista exactamente las migraciones esperadas | salida saneada de `db push --dry-run --linked` | operador + revisor |
| `DB-03` | Las doce migraciones quedan aplicadas en orden | `migration list --linked` y SHA | operador + revisor |
| `AUTH-01` | Config efectiva coincide con el contrato de Auth | valores no secretos y URL de staging | responsable Supabase |
| `AUTH-02` | Puente, TOTP, AAL2 y revocación pasan con identidad sintética | run `Staging Validation` verde | ingeniería |
| `AUTH-04` | Recuperación cambia la credencial y retira refresh tokens anteriores | CI local, run `Staging Validation` y smoke de correo verdes | ingeniería + correo |
| `RLS-01` | Matriz de cinco roles, cuenta inactiva y no enlazada pasa | mismo run y resumen RLS | ingeniería |
| `STO-01` | `documentos` y `backups` son privados y con límites esperados | consulta saneada y prueba de subida/descarga sintética | operador |
| `APP-01` | El CRM de staging ejecuta exactamente el SHA aprobado | URL de deployment y SHA | responsable de despliegue |
| `APP-03` | La URL canónica productiva usa Auth/MFA del CRM y no Vercel SSO | URL, resultado del smoke y configuración saneada | responsable de despliegue |
| `APP-02` | Smoke de cinco roles cumple navegación y propiedad | matriz completada sin identificadores de personas | QA + revisor |
| `MAIL-01` | Resend entrega a un buzón sintético controlado | ID de evento saneado y resultado SPF/DKIM/DMARC | responsable de correo |
| `WEB-01` | Cada webhook acepta firma válida y rechaza firma incorrecta | casos sintéticos y códigos HTTP | responsable de integración |
| `MON-01` | El monitor detecta `200` y alerta ante `503` en `/api/health` | prueba de alerta y recuperación | responsable de plataforma |
| `GO-01` | Todos los gates P0 pertenecen al mismo SHA | acta go/no-go con reversión | responsable del cambio |

`AUTH-04` exige tres capas para el mismo commit: proveedor local en CI, proveedor
alojado en `Staging Validation` y entrega real a un buzón sintético durante
`APP-02`/`MAIL-01`. Ninguna capa por sí sola cierra el gate.

## Fase 1 · Congelar el candidato

1. Elegir un SHA de `diego` y detener cambios de alcance durante la validación.
2. Confirmar `REL-01` en GitHub Actions: `audit`, `lint`, `typecheck`, `build`,
   `test` y `database` deben estar verdes para ese mismo SHA.
3. Registrar el SHA completo en la plantilla. Un run cancelado por concurrencia
   no sirve como evidencia.

## Fase 2 · Respaldo y recuperación

1. Confirmar `BAK-01` sin copiar capturas que muestren identificadores del
   proyecto, cadenas de conexión o información de clientes.
2. Ejecutar manualmente `External Backup` y verificar que el snapshot tenga una
   antigüedad menor o igual a una hora (`BAK-02`).
3. Aprobar el environment protegido `staging-restore` y ejecutar `Restore Drill`
   con confirmación `RESTORE_EMPTY_STAGING` (`RES-01`).
4. Guardar solo duración, recuento de tablas, recuento de objetos y URLs de los
   runs. No guardar dumps, manifiestos con rutas ni logs de filas.
5. Eliminar o purgar el proyecto restaurado y registrar `RES-02`.

Si la restauración falla, supera cuatro horas o no puede limpiarse, se detiene
el cambio. No se aplican migraciones administradas.

## Fase 3 · Preparar `staging-validation`

Una persona autorizada crea un segundo proyecto sin datos reales. Las
credenciales se entregan mediante un gestor o GitHub environment, nunca por
chat, `.env` versionado, ticket o documento.

Antes de enlazarlo, el operador comprueba que no tenga tablas de aplicación:

```bash
psql "$STAGING_VALIDATION_DB_URL" \
  --set ON_ERROR_STOP=on \
  --tuples-only \
  --command "select count(*) from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE';"
```

Resultado esperado para `DB-01`: `0`. No imprimir la cadena de conexión.

Después, desde un árbol limpio en el SHA candidato:

```bash
npx supabase link --project-ref "$SUPABASE_STAGING_PROJECT_REF"
npx supabase migration list --linked
npx supabase db push --dry-run --linked
```

El revisor compara el dry-run con los doce archivos de
`supabase/migrations/`. Si aparece una migración inesperada, una tabla previa o
una diferencia no explicada, se detiene. Solo entonces el operador ejecuta:

```bash
npx supabase db push --linked
npx supabase migration list --linked
```

No ejecutar `supabase config push` con el `config.toml` local: contiene URLs de
`127.0.0.1`. La persona responsable replica en staging únicamente estos valores
no secretos, usando las URLs reales del entorno:

- registro público desactivado;
- email/password habilitado para identidades administrativas;
- `jwt_expiry = 900`;
- rotación de refresh token activa;
- contraseña mínima de 12 caracteres con letras, números y símbolos;
- TOTP enroll/verify habilitado;
- redirects limitados al dominio exacto de staging.

Esto cierra `DB-02`, `DB-03` y `AUTH-01`.

## Fase 4 · Auth, MFA y RLS automatizados

Configurar el GitHub environment protegido `staging-validation` con revisores,
la variable `ENABLE_STAGING_VALIDATION=true` y estos secrets:

- `STAGING_SUPABASE_URL`
- `STAGING_SUPABASE_ANON_KEY`
- `STAGING_SUPABASE_SERVICE_ROLE_KEY`

Ejecutar manualmente `.github/workflows/staging-validation.yml` con la
confirmación `VERIFY_SYNTHETIC_STAGING`. El workflow:

- no aplica migraciones;
- se detiene antes de crear fixtures si detecta usuarios, identidades Auth,
  leads, documentos, tareas o comisiones existentes;
- crea identidades y filas con dominios `.invalid` e identificadores aleatorios;
- comprueba puente Auth, TOTP, AAL2, expiración y revocación;
- canjea una recuperación una sola vez, cambia la contraseña y retira los
  refresh tokens emitidos antes del cambio;
- comprueba la matriz RLS, denegación por defecto y escrituras reservadas al
  servidor;
- elimina identidades y filas sintéticas en bloques `finally` y vuelve a exigir
  staging vacío al terminar.

Solo un run verde cierra `AUTH-02` y `RLS-01`, y satisface la parte automatizada
de `AUTH-04`. Un run sin job, omitido o cancelado no es evidencia.

## Fase 5 · Despliegue y smoke

Desplegar el mismo SHA primero con `SUPABASE_AUTH_MODE=legacy`. Una vez
confirmadas migraciones y configuración Auth, cambiar staging a `bridge` con
`SUPABASE_AUTH_BRIDGE_DEADLINE` ISO futura de hasta 30 días.

Crear únicamente cuentas sintéticas y completar esta matriz:

| Rol | Debe abrir | Debe quedar fuera | Datos esperados |
| --- | --- | --- | --- |
| `SUPER_ADMIN` | `/usuarios`, `/permisos`, `/comisiones` | — | cartera completa con AAL2 |
| `ADMIN` | `/auditoria`, `/configuracion`, `/comisiones` | `/usuarios` | cartera completa con AAL2 |
| `EJECUTIVO` | `/dashboard`, `/pipeline`, `/leads` | `/configuracion` | cartera operativa sin comisiones directas |
| `AGENTE` | `/leads`, `/documentos`, `/solicitudes` | `/configuracion` | solo cartera asignada |
| `CLIENTE` | `/portal-cliente` | `/leads`, `/usuarios` | únicamente su ficha y documentos |

Para cada rol comprobar login, refresh, logout, navegación, listado y detalle.
Además:

1. crear y editar un lead sintético, moverlo por una transición permitida y
   confirmar que una transición inválida no se aplica;
2. cargar y descargar un PDF sintético sin información personal;
3. completar una solicitud y verificar checklist documental;
4. calcular una comisión sintética con el resultado esperado;
5. enviar un mensaje y confirmar persistencia después de recargar;
6. desactivar una cuenta sintética y confirmar que su siguiente solicitud no
   conserva acceso;
7. solicitar recuperación, abrir el enlace, cambiar la contraseña y confirmar
   que la anterior ya no inicia sesión ni el enlace vuelve a canjearse;
8. confirmar que el callback final no muestra el token en query, fragmento ni
   historial visible después del canje.

`APP-02` exige resultado esperado/observado por fila y revisión independiente.
No usar RUT, correo, documento ni nombre de una persona real.

## Fase 6 · Servicios y go/no-go

1. Probar Resend hacia un buzón sintético controlado (`MAIL-01`).
2. Confirmar `APP_URL`, `RESEND_API_KEY` y `FROM_EMAIL` en el entorno protegido,
   sin copiar sus valores a la evidencia (`AUTH-04`).
3. Probar cada webhook con payload sintético y ambas firmas (`WEB-01`).
4. Confirmar buckets privados y una carga/descarga sintética (`STO-01`).
5. Confirmar `/api/health` en `200`, simular `503` en staging y observar la
   alerta y su recuperación (`MON-01`).
6. Confirmar dos administradores recuperables (`ADM-01`) y rotación (`SEC-01`).
7. Revisar que `REL-01` a `APP-02` correspondan al mismo SHA.
8. Registrar responsable, ventana, observación y reversión (`GO-01`).

Producción permanece fuera de este runbook. Su aplicación es humana y solo se
evalúa después de cerrar todos los gates P0 en staging.

## Condiciones de detención

Detener el procedimiento si ocurre cualquiera de estos casos:

- el destino de validación contiene datos reales;
- el destino de restauración está conectado a una aplicación o servicio
  externo;
- el backup no es reciente o no puede restaurarse;
- el dry-run no coincide con las doce migraciones revisadas;
- un administrador entra con AAL1;
- se intenta activar `required` con una cuenta activa sin `auth_user_id`;
- una respuesta RLS no corresponde al rol;
- quedan filas o identidades sintéticas después de un run;
- el SHA de CI, deployment y evidencia no coincide;
- se requiere copiar un secreto o dato personal para continuar.
