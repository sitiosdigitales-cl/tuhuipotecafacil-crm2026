#!/usr/bin/php
<?php
/**
 * Email Handler - TuHipotecaFacil CRM
 * 
 * Este script recibe emails reenviados por cPanel (email piping)
 * y los envía al CRM via webhook.
 * 
 * Configuración en cPanel:
 * - Email Forwarder → Pipe to program
 * - Program: /home/usuario/public_html/crm/email-handler.php
 * 
 * @version 1.0.0
 */

// Configuración
$CRM_WEBHOOK_URL = 'https://tuhuipotecafacil-crm.vercel.app/api/webhook/email';
$LOG_FILE = __DIR__ . '/email-handler.log';

// Función para registrar logs
function logMessage($message) {
    global $LOG_FILE;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($LOG_FILE, "[{$timestamp}] {$message}\n", FILE_APPEND);
}

// Función para enviar al CRM
function sendToCRM($emailData) {
    global $CRM_WEBHOOK_URL;
    
    $ch = curl_init($CRM_WEBHOOK_URL);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($emailData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        logMessage("Error cURL: {$error}");
        return false;
    }
    
    logMessage("CRM Response ({$httpCode}): {$response}");
    return $httpCode >= 200 && $httpCode < 300;
}

// Función para parsear el email desde STDIN
function parseEmailFromSTDIN() {
    $stdin = file_get_contents("php://input");
    
    if (empty($stdin)) {
        logMessage("STDIN vacío");
        return null;
    }
    
    logMessage("Recibido " . strlen($stdin) . " bytes");
    
    // Intentar parsear como email simple
    $lines = explode("\n", $stdin);
    $emailData = [
        'from' => '',
        'to' => '',
        'subject' => '',
        'text' => '',
        'date' => '',
    ];
    
    $inHeaders = true;
    $bodyLines = [];
    $currentHeader = '';
    $currentValue = '';
    
    foreach ($lines as $line) {
        $line = rtrim($line, "\r\n");
        
        if ($inHeaders) {
            // Línea vacía = fin de headers
            if (empty($line)) {
                $inHeaders = false;
                if ($currentHeader) {
                    $emailData[strtolower($currentHeader)] = trim($currentValue);
                }
                continue;
            }
            
            // Header continuación (empieza con espacio/tab)
            if (preg_match('/^\s+/', $line)) {
                $currentValue .= ' ' . trim($line);
                continue;
            }
            
            // Nuevo header
            if ($currentHeader) {
                $emailData[strtolower($currentHeader)] = trim($currentValue);
            }
            
            if (preg_match('/^([^:]+):\s*(.*)$/', $line, $matches)) {
                $currentHeader = $matches[1];
                $currentValue = $matches[2];
            }
        } else {
            $bodyLines[] = $line;
        }
    }
    
    // Último header
    if ($currentHeader && $inHeaders === false) {
        $emailData[strtolower($currentHeader)] = trim($currentValue);
    }
    
    $emailData['text'] = implode("\n", $bodyLines);
    
    return $emailData;
}

// Función para parsear formato SendGrid
function parseSendGridFormat($rawBody) {
    $boundary = null;
    
    // Buscar boundary en content-type
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (preg_match('/boundary="?([^";\s]+)"?/', $contentType, $matches)) {
        $boundary = $matches[1];
    }
    
    if (!$boundary) {
        return null;
    }
    
    $parts = explode("--{$boundary}", $rawBody);
    $emailData = [
        'from' => '',
        'to' => '',
        'subject' => '',
        'text' => '',
        'html' => '',
    ];
    
    foreach ($parts as $part) {
        $part = trim($part);
        if (empty($part) || $part === '--') continue;
        
        // Separar headers del contenido
        $parts2 = explode("\n\n", $part, 2);
        if (count($parts2) < 2) continue;
        
        $headers = $parts2[0];
        $content = $parts2[1];
        
        // Extraer nombre del campo
        if (preg_match('/Content-Disposition:\s*form-data;\s*name="([^"]+)"/i', $headers, $matches)) {
            $name = $matches[1];
            $emailData[$name] = trim($content);
        }
    }
    
    return $emailData;
}

// ============ MAIN ============

logMessage("=== Email Handler Iniciado ===");
logMessage("Method: " . ($_SERVER['REQUEST_METHOD'] ?? 'CLI'));
logMessage("Content-Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'N/A'));

$emailData = null;

// Intentar diferentes métodos de parsing
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (strpos($contentType, 'multipart/form-data') !== false) {
    // SendGrid Inbound Parse format
    logMessage("Parseando formato SendGrid multipart");
    $rawBody = file_get_contents("php://input");
    $emailData = parseSendGridFormat($rawBody);
} else {
    // Formato genérico (email piping de cPanel)
    logMessage("Parseando formato email piping genérico");
    $emailData = parseEmailFromSTDIN();
}

if (!$emailData || empty($emailData['from'])) {
    logMessage("ERROR: No se pudo parsear el email o falta campo 'from'");
    logMessage("Data: " . print_r($emailData, true));
    exit(1);
}

logMessage("From: {$emailData['from']}");
logMessage("Subject: {$emailData['subject']}");
logMessage("To: {$emailData['to']}");

// Enviar al CRM
$result = sendToCRM($emailData);

if ($result) {
    logMessage("Email enviado al CRM exitosamente");
    echo "OK";
} else {
    logMessage("ERROR: Falló el envío al CRM");
    echo "ERROR";
    exit(1);
}

logMessage("=== Email Handler Finalizado ===");
?>
