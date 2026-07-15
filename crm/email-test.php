#!/usr/bin/php
<?php
// Test script - solo escribe en un log
$logFile = __DIR__ . '/email-test.log';
$logEntry = date('Y-m-d H:i:s') . " | Script ejecutado | STDIN length: " . strlen(file_get_contents("php://input")) . " bytes\n";
file_put_contents($logFile, $logEntry, FILE_APPEND);
echo "OK";
