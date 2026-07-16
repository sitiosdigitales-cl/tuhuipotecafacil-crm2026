#!/bin/bash
# Script de respaldo manual para TuHipotecaFacil CRM
# Uso: ./backup-manual.sh [URL_BASE]

# Configuracion
BACKUP_API_KEY="${BACKUP_API_KEY:-tuhuipotecafacil-backup-secret-2026}"
URL_BASE="${1:-https://tuhuipotecafacil-crm.vercel.app}"

echo "=== Respaldo Manual TuHipotecaFacil ==="
echo "Fecha: $(date)"
echo "URL Base: $URL_BASE"
echo ""

# 1. Crear respaldo
echo "1. Creando respaldo..."
RESPONSE=$(curl -s -X POST "$URL_BASE/api/backup" \
  -H "Authorization: Bearer $BACKUP_API_KEY" \
  -H "Content-Type: application/json")

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

# Verificar si fue exitoso
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo ""
  echo "2. Listando respaldos disponibles..."
  curl -s "$URL_BASE/api/backup" | python3 -m json.tool 2>/dev/null
else
  echo ""
  echo "ERROR: No se pudo crear el respaldo"
fi

echo ""
echo "=== Respaldo completado ==="
