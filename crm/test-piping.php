#!/usr/bin/php
<?php
// Script de prueba - solo verifica si PHP funciona con email piping
$logFile = __DIR__ . '/test-piping.log';

// Log de inicio
file_put_contents($logFile, date('Y-m-d H:i:s') . " | PHP script ejecutado OK\n", FILE_APPEND);

// Leer STDIN
$stdin = file_get_contents("php://input");
file_put_contents($logFile, date('Y-m-d H:i:s') . " | STDIN bytes: " . strlen($stdin) . "\n", FILE_APPEND);

if (strlen($stdin) > 0) {
    file_put_contents($logFile, date('Y-m-d H:i:s') . " | Email recibido: " . substr($stdin, 0, 100) . "...\n", FILE_APPEND);
}

echo "Test OK";
