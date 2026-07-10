<?php
// Instalador CRM - Ejecutar desde la raíz del sitio
header('Content-Type: text/html; charset=utf-8');

$zipFile = '/home/wkthctgt/public_html/crm/crm-deploy.zip';
$extractDir = '/home/wkthctgt/public_html/crm';

echo "<!DOCTYPE html><html><head><meta charset='utf-8'><title>CRM Installer</title>";
echo "<style>body{font-family:Arial;max-width:600px;margin:40px auto;padding:20px;}";
echo ".ok{color:green;background:#d4edda;padding:10px;border-radius:5px;margin:10px 0;}";
echo ".err{color:red;background:#f8d7da;padding:10px;border-radius:5px;margin:10px 0;}";
echo "h1{color:#333;} h2{color:#555;}</style></head><body>";
echo "<h1>CRM TuHipotecaFacil - Instalador</h1>";

if (!file_exists($zipFile)) {
    echo "<div class='err'>ZIP no encontrado en: $zipFile</div>";
    echo "<p>Verifica que el archivo crm-deploy.zip esté en /public_html/crm/</p>";
    echo "</body></html>";
    exit;
}

echo "<p>Archivo encontrado: " . filesize($zipFile) . " bytes</p>";

$zip = new ZipArchive();
if ($zip->open($zipFile) === TRUE) {
    $zip->extractTo($extractDir);
    $zip->close();
    echo "<div class='ok'>CRM instalado exitosamente!</div>";
    echo "<h2>Siguiente paso:</h2>";
    echo "<p>1. Ve a: <a href='/crm/'>/crm/</a></p>";
    echo "<p>2. Crea la base de datos en phpMyAdmin</p>";
    echo "<p>3. Ejecuta el SQL que te proporcioné</p>";
} else {
    echo "<div class='err'>Error al abrir el ZIP</div>";
}

echo "</body></html>";
?>
