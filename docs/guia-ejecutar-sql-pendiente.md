# Guía: Ejecutar SQL Pendiente en Supabase

## Resumen

Este script crea todas las tablas pendientes del CRM en una sola ejecución.

### Tablas que se crearán:

| Tabla | Descripción |
|-------|-------------|
| `auditoria` | Registro de acciones de usuarios |
| `conversaciones` | Conversaciones del chat interno |
| `mensajes` | Mensajes del chat interno |
| `flujo_ejecuciones` | Historial de ejecuciones de flujos automáticos |
| `trigger_ejecuciones` | Historial de ejecuciones de triggers |
| `preferencias_notificacion` | Preferencias de notificación por usuario |
| `campanas` | Campañas de marketing |
| `landings` | Landing pages |
| `biblioteca` | Biblioteca de documentos |
| `flujos` | Flujos automáticos |
| `plantillas` | Plantillas de email/mensajes |
| `triggers` | Reglas de automatización |
| `integraciones` | Integraciones externas |
| `comisiones` | Comisiones de ejecutivos |

---

## Pasos para ejecutar

### 1. Acceder a Supabase

1. Ve a https://supabase.com/dashboard
2. Selecciona el proyecto: `dcoyjvbhrkarrmetrhiv`
3. En el menú lateral, ve a **SQL Editor**

### 2. Copiar el script

1. Abre el archivo: `prisma/run-all-pending.sql`
2. Selecciona **TODO** el contenido (Ctrl+A)
3. Copia (Ctrl+C)

### 3. Ejecutar en Supabase

1. En el SQL Editor de Supabase, haz clic en **New Query**
2. Pega el script (Ctrl+V)
3. Haz clic en **Run** (o presiona Ctrl+Enter)
4. Espera a que termine (puede tomar 10-30 segundos)

### 4. Verificar

Después de ejecutar, ve a **Table Editor** en Supabase y verifica que las tablas aparecen:

- ✅ auditoria
- ✅ conversaciones
- ✅ mensajes
- ✅ flujo_ejecuciones
- ✅ trigger_ejecuciones
- ✅ preferencias_notificacion
- ✅ campanas
- ✅ landings
- ✅ biblioteca
- ✅ flujos
- ✅ plantillas
- ✅ triggers
- ✅ integraciones
- ✅ comisiones

---

## Troubleshooting

### Si alguna tabla ya existe

El script usa `CREATE TABLE IF NOT EXISTS`, así que no borra datos existentes. Si una tabla ya existe, simplemente la ignora.

### Si hay errores de permisos

Asegúrate de estar usando la service role key o ser admin del proyecto.

### Si falla el bucket de backups

El bucket ya debería existir. Si no, ejecuta este SQL adicional:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;
```

---

## Después de ejecutar

Una vez creadas las tablas, el CRM podrá usar todas estas funcionalidades:

1. **Auditoría**: Las acciones de los usuarios se registrarán automáticamente
2. **Chat interno**: Los usuarios podrán enviarse mensajes
3. **Automatizaciones**: Los flujos y triggers guardarán su historial
4. **Notificaciones**: Los usuarios podrán configurar sus preferencias
5. **Marketing**: Las campañas, landing pages y biblioteca funcionarán
6. **Comisiones**: Se podrá calcular y gestionar comisiones
