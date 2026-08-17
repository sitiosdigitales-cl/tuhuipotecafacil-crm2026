#!/usr/bin/php
<?php
/**
 * Email Handler - TuHipotecaFacil CRM
 *
 * Recibe los correos que cPanel entrega por email piping y los manda al CRM.
 * Corre en cPanel, no en Vercel: por eso vive en wordpress/ y no en src/.
 *
 * Configuración en cPanel:
 * - Email Forwarder → Pipe to program
 * - Program: <ruta del script>, FUERA de public_html
 *
 * Variables de entorno obligatorias:
 * - CRM_EMAIL_WEBHOOK_URL     destino del POST, el /api/webhook/email desplegado
 * - CRM_EMAIL_WEBHOOK_SECRET  mismo valor que EMAIL_WEBHOOK_SECRET en Vercel
 * - CRM_EMAIL_LOG             opcional; por omisión el temporal del sistema
 *
 * @version 2.0.0
 */

// El destino no se escribe acá: un dominio viejo hardcodeado pierde correo en
// silencio, que es exactamente lo que hay que evitar en el camino de un lead.
$CRM_WEBHOOK_URL = getenv('CRM_EMAIL_WEBHOOK_URL') ?: '';

// El log conserva solo estado operativo, nunca contenido del correo ni la
// respuesta del CRM. Se crea privado incluso si el temporal es compartido.
umask(0077);
$LOG_FILE = getenv('CRM_EMAIL_LOG') ?: (sys_get_temp_dir() . '/crm-email-handler.log');

// Función para registrar logs
function logMessage($message) {
    global $LOG_FILE;
    $timestamp = date('Y-m-d H:i:s');
    $written = file_put_contents($LOG_FILE, "[{$timestamp}] {$message}\n", FILE_APPEND | LOCK_EX);
    if ($written !== false) {
        chmod($LOG_FILE, 0600);
    }
}

// ============ CODIFICACIÓN ============
//
// El correo llega con los bytes del charset que declare el remitente, que en
// Chile todavía suele ser ISO-8859-1. `json_encode` devuelve `false` ante bytes
// que no son UTF-8 y ese `false` terminaba en cURL como cuerpo vacío: el CRM
// respondía 200 y el lead se perdía sin dejar rastro.

/** Validez UTF-8 sin depender de mbstring: `//u` la comprueba en el núcleo. */
function esUtf8Valido($texto) {
    return $texto === '' || preg_match('//u', $texto) === 1;
}

/** Charset declarado en `Content-Type`. Cadena vacía si no viene. */
function charsetDeclarado($contentType) {
    if (preg_match('/charset\s*=\s*"?([A-Za-z0-9_.:-]+)"?/i', $contentType, $coincidencias)) {
        return $coincidencias[1];
    }
    return '';
}

/**
 * Solo se usa cuando el correo no declara charset. Convertir desde un charset
 * equivocado NO falla: produce basura en silencio, así que conviene detectar
 * antes que asumir.
 */
function detectarCharset($texto) {
    if (esUtf8Valido($texto)) {
        return 'UTF-8';
    }
    if (function_exists('mb_detect_encoding')) {
        $detectado = mb_detect_encoding($texto, ['UTF-8', 'ISO-8859-1', 'Windows-1252'], true);
        if (is_string($detectado) && $detectado !== '') {
            return $detectado;
        }
    }
    // Windows-1252 es superconjunto práctico de ISO-8859-1 y además cubre las
    // comillas tipográficas que Outlook coloca entre 0x80 y 0x9F.
    return 'Windows-1252';
}

/** Último recurso, sin extensiones: mapeo directo ISO-8859-1 a UTF-8. */
function latin1AUtf8($texto) {
    $salida = '';
    $longitud = strlen($texto);
    for ($indice = 0; $indice < $longitud; $indice++) {
        $byte = ord($texto[$indice]);
        if ($byte < 0x80) {
            $salida .= chr($byte);
            continue;
        }
        $salida .= chr(0xC0 | ($byte >> 6)) . chr(0x80 | ($byte & 0x3F));
    }
    return $salida;
}

/** Convierte a UTF-8 con degradación mbstring, iconv y manual. */
function aUtf8($texto, $charset) {
    if ($texto === '' || $texto === null) {
        return '';
    }

    $origen = trim($charset);
    $declaraUtf8 = strcasecmp($origen, 'UTF-8') === 0;

    if ($declaraUtf8 && esUtf8Valido($texto)) {
        return $texto;
    }
    // Sin charset, o con uno que se contradice a sí mismo: declararse UTF-8 y
    // no serlo es prueba de que la cabecera miente, y hacerle caso convertiría
    // los acentos en signos de interrogación pudiendo recuperarlos.
    if ($origen === '' || $declaraUtf8) {
        $origen = detectarCharset($texto);
    }

    if (function_exists('mb_convert_encoding')) {
        $convertido = @mb_convert_encoding($texto, 'UTF-8', $origen);
        if (is_string($convertido) && esUtf8Valido($convertido)) {
            return $convertido;
        }
    }
    if (function_exists('iconv')) {
        $convertido = @iconv($origen, 'UTF-8//TRANSLIT', $texto);
        if (is_string($convertido) && esUtf8Valido($convertido)) {
            return $convertido;
        }
    }

    return latin1AUtf8($texto);
}

/**
 * Serializa la estructura fija. La sustitución de bytes inválidos es la ÚLTIMA
 * red: destruye los acentos que la conversión sí habría conservado, así que
 * solo entra cuando el charset declarado mintió y la detección tampoco acertó.
 * Perder un acento es aceptable; perder el correo entero no.
 */
function serializarPayload($payload) {
    $banderas = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;

    $json = json_encode($payload, $banderas);
    if (is_string($json)) {
        return $json;
    }

    $json = json_encode($payload, $banderas | JSON_INVALID_UTF8_SUBSTITUTE);
    return is_string($json) ? $json : null;
}

// Función para enviar al CRM
function sendToCRM($cuerpoJson) {
    global $CRM_WEBHOOK_URL;

    // El secreto se lee del entorno, nunca se escribe en este archivo.
    // Debe coincidir con EMAIL_WEBHOOK_SECRET configurada en Vercel.
    $secret = getenv('CRM_EMAIL_WEBHOOK_SECRET') ?: '';

    // Los dos son obligatorios. Sin secreto el endpoint responde 401 y el
    // correo se pierde igual, así que conviene detenerse acá y dejarlo escrito
    // en vez de mandar un POST que ya se sabe que va a fallar.
    if ($CRM_WEBHOOK_URL === '') {
        logMessage('ERROR: falta CRM_EMAIL_WEBHOOK_URL');
        return false;
    }
    if ($secret === '') {
        logMessage('ERROR: falta CRM_EMAIL_WEBHOOK_SECRET');
        return false;
    }

    $headers = [
        'Content-Type: application/json',
        'X-Webhook-Secret: ' . $secret,
    ];

    $ch = curl_init($CRM_WEBHOOK_URL);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $cuerpoJson);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    if ($error) {
        logMessage("Error cURL: {$error}");
        return false;
    }
    
    logMessage("CRM Response ({$httpCode})");
    return $httpCode >= 200 && $httpCode < 300;
}

// Función para parsear el email desde STDIN
function parseEmailFromSTDIN() {
    // `php://input` es el cuerpo de una petición HTTP y está VACÍO cuando el
    // script corre como CLI, que es como lo invoca el piping de cPanel. Era el
    // motivo por el que este camino nunca creó un lead: leía el flujo
    // equivocado, registraba "STDIN vacío" y salía con error.
    $stdin = file_get_contents("php://stdin");

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
    exit(1);
}

// Estructura FIJA, construida campo por campo. El correo trae las cabeceras que
// quiera su remitente, y antes cualquiera de ellas entraba al JSON.
$charset = charsetDeclarado(isset($emailData['content-type']) ? $emailData['content-type'] : '');
$payload = [
    'from'    => aUtf8(isset($emailData['from']) ? $emailData['from'] : '', $charset),
    'to'      => aUtf8(isset($emailData['to']) ? $emailData['to'] : '', $charset),
    'subject' => aUtf8(isset($emailData['subject']) ? $emailData['subject'] : '', $charset),
    'text'    => aUtf8(isset($emailData['text']) ? $emailData['text'] : '', $charset),
    'date'    => aUtf8(isset($emailData['date']) ? $emailData['date'] : '', $charset),
];

$cuerpoJson = serializarPayload($payload);
if ($cuerpoJson === null) {
    // Nunca postear con cuerpo vacío: el CRM respondería 200 y el correo se
    // perdería sin que el código de salida lo reflejara.
    logMessage("ERROR: no se pudo serializar el mensaje");
    echo "ERROR";
    exit(1);
}

logMessage("Correo parseado; enviando al CRM");

// Enviar al CRM
$result = sendToCRM($cuerpoJson);

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
