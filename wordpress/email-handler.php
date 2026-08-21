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
 * @version 2.1.0
 */

// El destino no se escribe acá: un dominio viejo hardcodeado pierde correo en
// silencio, que es exactamente lo que hay que evitar en el camino de un lead.
$CRM_WEBHOOK_URL = getenv('CRM_EMAIL_WEBHOOK_URL') ?: '';

// El log conserva solo estado operativo, nunca contenido del correo ni la
// respuesta del CRM. Se crea privado incluso si el temporal es compartido.
umask(0077);
$LOG_FILE = getenv('CRM_EMAIL_LOG') ?: (sys_get_temp_dir() . '/crm-email-handler.log');

const MAX_EMAIL_STDIN_BYTES = 1048576;
const MAX_MIME_DEPTH = 10;
const MAX_MIME_PARTS = 100;

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

function decodificarCabeceraMime($valor) {
    if ($valor === '') {
        return '';
    }
    if (function_exists('mb_decode_mimeheader')) {
        $decodificado = @mb_decode_mimeheader($valor);
        if (is_string($decodificado) && esUtf8Valido($decodificado)) {
            return $decodificado;
        }
    }
    if (function_exists('iconv_mime_decode')) {
        $decodificado = @iconv_mime_decode($valor, ICONV_MIME_DECODE_CONTINUE_ON_ERROR, 'UTF-8');
        if (is_string($decodificado) && esUtf8Valido($decodificado)) {
            return $decodificado;
        }
    }

    return preg_replace_callback(
        '/=\?([^?]+)\?([bq])\?([^?]*)\?=/i',
        function ($coincidencia) {
            $bytes = strcasecmp($coincidencia[2], 'B') === 0
                ? base64_decode($coincidencia[3], true)
                : quoted_printable_decode(str_replace('_', ' ', $coincidencia[3]));
            if (!is_string($bytes)) {
                return '';
            }
            return aUtf8($bytes, $coincidencia[1]);
        },
        $valor
    );
}

function separarCabecerasYCuerpo($mensaje) {
    if (preg_match("/\r?\n\r?\n/", $mensaje, $coincidencia, PREG_OFFSET_CAPTURE)) {
        $separador = $coincidencia[0][0];
        $posicion = $coincidencia[0][1];
        return [
            substr($mensaje, 0, $posicion),
            substr($mensaje, $posicion + strlen($separador)),
        ];
    }
    return [$mensaje, ''];
}

function parsearCabeceras($bloque) {
    $cabeceras = [];
    $actual = null;
    foreach (preg_split('/\r?\n/', $bloque) as $linea) {
        if ($actual !== null && preg_match('/^[ \t]/', $linea)) {
            $cabeceras[$actual] .= ' ' . trim($linea);
            continue;
        }
        if (!preg_match('/^([^:]+):\s*(.*)$/', $linea, $coincidencia)) {
            $actual = null;
            continue;
        }
        $actual = strtolower(trim($coincidencia[1]));
        $valor = trim($coincidencia[2]);
        $cabeceras[$actual] = isset($cabeceras[$actual])
            ? $cabeceras[$actual] . ', ' . $valor
            : $valor;
    }
    return $cabeceras;
}

function parametroMime($valor, $nombre) {
    $patron = '/(?:^|;)\s*' . preg_quote($nombre, '/') . '\s*=\s*(?:"([^"]*)"|([^;\s]*))/i';
    if (!preg_match($patron, $valor, $coincidencia)) {
        return '';
    }
    return isset($coincidencia[1]) && $coincidencia[1] !== ''
        ? $coincidencia[1]
        : ($coincidencia[2] ?? '');
}

function decodificarTransferencia($cuerpo, $codificacion) {
    $normalizada = strtolower(trim($codificacion));
    if ($normalizada === 'base64') {
        $decodificado = base64_decode(preg_replace('/\s+/', '', $cuerpo), true);
        return is_string($decodificado) ? $decodificado : '';
    }
    if ($normalizada === 'quoted-printable') {
        return quoted_printable_decode($cuerpo);
    }
    return $cuerpo;
}

function dividirMultipart($cuerpo, $boundary) {
    if ($boundary === '') {
        return [];
    }
    $lineas = preg_split('/\r?\n/', $cuerpo);
    $partes = [];
    $actual = [];
    $dentro = false;
    $inicio = '--' . $boundary;
    $fin = $inicio . '--';

    foreach ($lineas as $linea) {
        if ($linea === $inicio || $linea === $fin) {
            if ($dentro && $actual !== []) {
                $partes[] = implode("\r\n", $actual);
                $actual = [];
            }
            if ($linea === $fin) {
                break;
            }
            $dentro = true;
            continue;
        }
        if ($dentro) {
            $actual[] = $linea;
        }
    }
    return $partes;
}

function textoDesdeHtml($html) {
    $conSaltos = preg_replace('/<(?:br|\/p|\/div|\/li|\/tr)\b[^>]*>/i', "\n", $html);
    $texto = html_entity_decode(strip_tags($conSaltos), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    return trim(preg_replace("/[ \t]+\n|\n{3,}/", "\n", $texto));
}

function extraerTextoMime($mensaje, $profundidad, &$partesVistas) {
    if ($profundidad > MAX_MIME_DEPTH || $partesVistas >= MAX_MIME_PARTS) {
        return ['plain' => '', 'html' => ''];
    }
    $partesVistas++;

    list($bloqueCabeceras, $cuerpo) = separarCabecerasYCuerpo($mensaje);
    $cabeceras = parsearCabeceras($bloqueCabeceras);
    $contentType = $cabeceras['content-type'] ?? 'text/plain; charset=UTF-8';
    $tipo = strtolower(trim(explode(';', $contentType, 2)[0]));
    $disposicion = strtolower($cabeceras['content-disposition'] ?? '');
    $tieneArchivo = parametroMime($disposicion, 'filename') !== '' ||
        parametroMime($contentType, 'name') !== '';

    if (strpos($disposicion, 'attachment') === 0 || $tieneArchivo) {
        return ['plain' => '', 'html' => ''];
    }

    if (strpos($tipo, 'multipart/') === 0) {
        $resultado = ['plain' => '', 'html' => ''];
        foreach (dividirMultipart($cuerpo, parametroMime($contentType, 'boundary')) as $parte) {
            $extraido = extraerTextoMime($parte, $profundidad + 1, $partesVistas);
            if ($resultado['plain'] === '' && $extraido['plain'] !== '') {
                $resultado['plain'] = $extraido['plain'];
            }
            if ($resultado['html'] === '' && $extraido['html'] !== '') {
                $resultado['html'] = $extraido['html'];
            }
        }
        return $resultado;
    }

    $bytes = decodificarTransferencia(
        $cuerpo,
        $cabeceras['content-transfer-encoding'] ?? ''
    );
    $texto = aUtf8($bytes, parametroMime($contentType, 'charset'));
    if ($tipo === 'text/plain') {
        return ['plain' => trim($texto), 'html' => ''];
    }
    if ($tipo === 'text/html') {
        return ['plain' => '', 'html' => textoDesdeHtml($texto)];
    }
    return ['plain' => '', 'html' => ''];
}

function leerStdinLimitado() {
    $stream = fopen('php://stdin', 'rb');
    if ($stream === false) {
        return null;
    }
    $entrada = '';
    while (!feof($stream)) {
        $trozo = fread($stream, 8192);
        if ($trozo === false) {
            fclose($stream);
            return null;
        }
        $entrada .= $trozo;
        if (strlen($entrada) > MAX_EMAIL_STDIN_BYTES) {
            fclose($stream);
            return false;
        }
    }
    fclose($stream);
    return $entrada;
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

function parseEmailFromSTDIN() {
    $stdin = leerStdinLimitado();
    if ($stdin === false) {
        logMessage("ERROR: correo supera el limite de 1 MiB");
        return null;
    }
    if ($stdin === null || $stdin === '') {
        logMessage("STDIN vacío");
        return null;
    }

    logMessage("Recibido " . strlen($stdin) . " bytes");
    list($bloqueCabeceras) = separarCabecerasYCuerpo($stdin);
    $cabeceras = parsearCabeceras($bloqueCabeceras);
    $partesVistas = 0;
    $contenido = extraerTextoMime($stdin, 0, $partesVistas);

    return [
        'from' => decodificarCabeceraMime($cabeceras['from'] ?? ''),
        'to' => decodificarCabeceraMime($cabeceras['to'] ?? ''),
        'subject' => decodificarCabeceraMime($cabeceras['subject'] ?? ''),
        'text' => $contenido['plain'] !== '' ? $contenido['plain'] : $contenido['html'],
        'date' => $cabeceras['date'] ?? '',
        'message-id' => $cabeceras['message-id'] ?? '',
    ];
}

// ============ MAIN ============

logMessage("=== Email Handler Iniciado ===");
logMessage("Method: " . ($_SERVER['REQUEST_METHOD'] ?? 'CLI'));
logMessage("Content-Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'N/A'));

logMessage("Parseando formato email piping genérico");
$emailData = parseEmailFromSTDIN();

if (!$emailData || empty($emailData['from'])) {
    logMessage("ERROR: No se pudo parsear el email o falta campo 'from'");
    exit(1);
}

// Estructura FIJA, construida campo por campo. El correo trae las cabeceras que
// quiera su remitente, y antes cualquiera de ellas entraba al JSON.
$payload = [
    'from'      => aUtf8(isset($emailData['from']) ? $emailData['from'] : '', ''),
    'to'        => aUtf8(isset($emailData['to']) ? $emailData['to'] : '', ''),
    'subject'   => aUtf8(isset($emailData['subject']) ? $emailData['subject'] : '', ''),
    'text'      => aUtf8(isset($emailData['text']) ? $emailData['text'] : '', ''),
    'date'      => aUtf8(isset($emailData['date']) ? $emailData['date'] : '', ''),
    'messageId' => aUtf8(isset($emailData['message-id']) ? $emailData['message-id'] : '', ''),
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
