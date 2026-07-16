# Checklist: Configuración del CRM TuHipotecaFacil

## ✅ Completado

### Sistema de Backups
- [x] API de backups funcional (`/api/backup`)
- [x] Script de backup manual (`scripts/backup-manual.sh`)
- [x] Página de UI para gestionar backups (`/backups`)
- [x] Bucket de backups en Supabase
- [x] Variable `BACKUP_API_KEY` configurada

### Tablas de Base de Datos
- [x] Script SQL unificado creado (`prisma/run-all-pending.sql`)
- [x] Guía de ejecución (`docs/guia-ejecutar-sql-pendiente.md`)
- [x] 14 tablas pendientes documentadas

### Email Piping
- [x] Webhook endpoint funcional (`/api/webhook/email`)
- [x] Script PHP para cPanel (`crm/email-handler.php`)
- [x] Script de prueba (`crm/test-email-webhook.sh`)
- [x] Guías para cPanel, SendGrid y Mailgun

---

## ⏳ Pendiente (Requiere tu acción)

### 1. Ejecutar SQL en Supabase
**Tiempo estimado: 5 minutos**

1. Ir a https://supabase.com/dashboard
2. Seleccionar proyecto → SQL Editor
3. Copiar contenido de `prisma/run-all-pending.sql`
4. Pegar y ejecutar
5. Verificar tablas en Table Editor

### 2. Variables de Entorno en Vercel
**Tiempo estimado: 10 minutos**

Ir a Vercel → Settings → Environment Variables y agregar:

| Variable | Dónde obtenerla |
|----------|-----------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role |
| `RESEND_API_KEY` | Resend.com → API Keys |
| `ELEMENTOR_WEBHOOK_SECRET` | Generar: `tuhipotecafacil-webhook-secret-2026` |

Después: Redesplegar el proyecto en Vercel.

### 3. Configurar Email Piping
**Tiempo estimado: 15 minutos**

Elige una opción:

**Opción A: cPanel (más fácil)**
1. Subir `crm/email-handler.php` al hosting
2. Configurar Email Forwarder en cPanel
3. Probar enviando email a `contacto@tuhipotecafacil.cl`

**Opción B: SendGrid (más profesional)**
1. Crear cuenta en SendGrid
2. Configurar Inbound Parse
3. Agregar MX record en DNS

### 4. Verificar DNS para Resend
**Tiempo estimado: 10 minutos**

1. Crear cuenta en Resend.com
2. Agregar dominio `tuhipotecafacil.cl`
3. Configurar registros DNS (SPF, DKIM, DMARC)
4. Esperar verificación

---

## 📋 Resumen de Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `scripts/backup-manual.sh` | Script de backup manual |
| `src/app/(dashboard)/backups/page.tsx` | Página de UI para backups |
| `prisma/run-all-pending.sql` | Script SQL unificado |
| `docs/guia-ejecutar-sql-pendiente.md` | Guía para ejecutar SQL |
| `crm/email-handler.php` | Script PHP para email piping |
| `crm/test-email-webhook.sh` | Script de prueba |
| `docs/setup-email-piping.md` | Guía de email piping |
| `docs/setup-vercel-env.md` | Guía de variables de entorno |
| `docs/CHECKLIST-CONFIGURACION.md` | Este archivo |

---

## 🚀 Siguientes Pasos

1. **Ejecutar SQL** → Seguir `docs/guia-ejecutar-sql-pendiente.md`
2. **Configurar Vercel** → Seguir `docs/setup-vercel-env.md`
3. **Configurar Email** → Seguir `docs/setup-email-piping.md`
4. **Probar todo** → Verificar que emails, webhooks y backups funcionan

---

## 📞 Soporte

Si tienes dudas o problemas:
1. Revisar los logs en Vercel → Logs
2. Revisar los logs en Supabase → Logs
3. Ejecutar los scripts de prueba incluidos
