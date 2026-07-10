<?php
// Extractor de CRM
$zipFile = dirname(__FILE__) . '/crm-deploy.zip';
$extractDir = dirname(__FILE__);

echo "<h1>Instalando CRM...</h1>";

if (!file_exists($zipFile)) {
    die("Error: ZIP no encontrado en " . $zipFile);
}

echo "<p>Archivo encontrado: " . filesize($zipFile) . " bytes</p>";

$zip = new ZipArchive();
if ($zip->open($zipFile) === TRUE) {
    $zip->extractTo($extractDir);
    $zip->close();
    echo "<h2 style='color:green'>CRM Instalado!</h2>";
    echo "<p>Ve a: <a href='/crm/'>/crm/</a></p>";
} else {
    echo "Error al abrir ZIP";
}
?>
