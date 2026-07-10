<?php
// Script de instalación de la base de datos CRM
// Subir a public_html/setup-db.php y ejecutar desde el navegador

header('Content-Type: text/html; charset=utf-8');

// Configuración de la base de datos
$host = 'localhost';
$user = 'wkthctgt_crm';
$password = 'CRM2026!Secure';
$database = 'wkthctgt_crm';

echo "<!DOCTYPE html>";
echo "<html><head><title>Instalación CRM</title>";
echo "<style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;}";
echo ".success{color:green;background:#d4edda;padding:10px;border-radius:5px;margin:10px 0;}";
echo ".error{color:red;background:#f8d7da;padding:10px;border-radius:5px;margin:10px 0;}";
echo "h1{color:#333;} h2{color:#555;margin-top:20px;}</style></head><body>";
echo "<h1>Instalación CRM TuHipotecaFacil</h1>";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<div class='success'>Conexión exitosa a la base de datos</div>";
    
    // Crear tabla usuarios
    $pdo->exec("CREATE TABLE IF NOT EXISTS usuarios (
        id VARCHAR(36) PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        telefono VARCHAR(20),
        rol VARCHAR(20) DEFAULT 'EJECUTIVO',
        estado VARCHAR(20) DEFAULT 'ACTIVO',
        avatar VARCHAR(255),
        doisFA BOOLEAN DEFAULT FALSE,
        intentosFallidos INT DEFAULT 0,
        suspendidoHasta DATETIME,
        ultimoAcceso DATETIME,
        creadoEn DATETIME DEFAULT CURRENT_TIMESTAMP,
        actualizadoEn DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
    echo "<div class='success'>Tabla usuarios creada</div>";
    
    // Crear tabla leads
    $pdo->exec("CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(36) PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        rut VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255),
        telefono VARCHAR(20),
        origen VARCHAR(50) DEFAULT 'WEB',
        etapa VARCHAR(50) DEFAULT 'NUEVO_LEAD',
        prioridad VARCHAR(20) DEFAULT 'MEDIA',
        nombreEjecutivo VARCHAR(100),
        banco VARCHAR(100),
        tipoCredito VARCHAR(100),
        montoSolicitado DECIMAL(15,2),
        valorPropiedad DECIMAL(15,2),
        pieDisponible DECIMAL(15,2),
        notas TEXT,
        situacionLaboral VARCHAR(50) DEFAULT 'DEPENDIENTE',
        enDicom BOOLEAN DEFAULT FALSE,
        dicomDetalle TEXT,
        rentaMensual VARCHAR(50),
        diasEnEtapa INT DEFAULT 0,
        creadoEn DATETIME DEFAULT CURRENT_TIMESTAMP,
        actualizadoEn DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
    echo "<div class='success'>Tabla leads creada</div>";
    
    // Crear tabla documentos
    $pdo->exec("CREATE TABLE IF NOT EXISTS documentos (
        id VARCHAR(36) PRIMARY KEY,
        leadId VARCHAR(36) NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        tipo VARCHAR(100),
        estado VARCHAR(50) DEFAULT 'PENDIENTE',
        archivoUrl TEXT,
        tamano INT,
        creadoEn DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
    echo "<div class='success'>Tabla documentos creada</div>";
    
    // Crear tabla tareas
    $pdo->exec("CREATE TABLE IF NOT EXISTS tareas (
        id VARCHAR(36) PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        estado VARCHAR(50) DEFAULT 'PENDIENTE',
        tipo VARCHAR(50) DEFAULT 'SEGUIMIENTO',
        prioridad VARCHAR(20) DEFAULT 'MEDIA',
        asignadoA VARCHAR(36),
        nombreEjecutivo VARCHAR(100),
        leadId VARCHAR(36),
        leadNombre VARCHAR(200),
        fechaVencimiento DATETIME,
        recordatorio DATETIME,
        duracionEstimada INT,
        etiquetas TEXT,
        creadoEn DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
    echo "<div class='success'>Tabla tareas creada</div>";
    
    // Crear tabla actividades
    $pdo->exec("CREATE TABLE IF NOT EXISTS actividades (
        id VARCHAR(36) PRIMARY KEY,
        leadId VARCHAR(36) NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        usuario VARCHAR(100),
        usuarioId VARCHAR(36),
        metadata JSON,
        creadoEn DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
    echo "<div class='success'>Tabla actividades creada</div>";
    
    // Insertar usuarios de prueba
    $stmt = $pdo->prepare("INSERT IGNORE INTO usuarios (id, nombre, apellido, email, password, rol) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute(['u1', 'Admin', 'Sistema', 'admin@tuhipotecafacil.cl', password_hash('demo1234', PASSWORD_DEFAULT), 'SUPER_ADMIN']);
    $stmt->execute(['u2', 'Andrés', 'Pérez', 'andres.perez@tuhipotecafacil.cl', password_hash('demo1234', PASSWORD_DEFAULT), 'ADMIN']);
    $stmt->execute(['u3', 'Carolina', 'Muñoz', 'carolina.munoz@tuhipotecafacil.cl', password_hash('demo1234', PASSWORD_DEFAULT), 'GERENTE']);
    $stmt->execute(['u4', 'Diego', 'Silva', 'diego.silva@tuhipotecafacil.cl', password_hash('demo1234', PASSWORD_DEFAULT), 'EJECUTIVO']);
    $stmt->execute(['u5', 'Valentina', 'Torres', 'valentina.torres@tuhipotecafacil.cl', password_hash('demo1234', PASSWORD_DEFAULT), 'EJECUTIVO']);
    echo "<div class='success'>5 usuarios de prueba creados</div>";
    
    // Insertar leads de prueba
    $stmt = $pdo->prepare("INSERT IGNORE INTO leads (id, nombre, apellido, rut, email, telefono, origen, etapa, prioridad, banco, tipoCredito, montoSolicitado, valorPropiedad, pieDisponible, notas, situacionLaboral, nombreEjecutivo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    $leads = [
        ['lead-1', 'Juan Carlos', 'Silva Muñoz', '16.567.890-1', 'juan.silva@gmail.com', '+56987654321', 'REFERIDO', 'DOCS_COMPLETAS', 'ALTA', 'Banco de Chile', 'Crédito Hipotecario', 150000000, 220000000, 70000000, 'Cliente interesado en crédito hipotecario', 'INDEPENDIENTE', 'Andrés Pérez'],
        ['lead-2', 'María', 'González', '12.345.678-5', 'maria.gonzalez@email.cl', '+56912345678', 'REFERIDO', 'CONTACTADO', 'MEDIA', 'Santander', 'Crédito Hipotecario', 120000000, 180000000, 60000000, 'Primera contactada por referido', 'DEPENDIENTE', 'Andrés Pérez'],
        ['lead-3', 'Carlos', 'Rojas', '15.234.567-8', 'carlos.rojas@email.cl', '+56923456789', 'FACEBOOK', 'INTERESADO', 'ALTA', 'Bci', 'Crédito Hipotecario', 95000000, 140000000, 45000000, 'Interesado en departamento', 'DEPENDIENTE', 'Carolina Muñoz'],
        ['lead-4', 'Juan', 'Pérez', '18.765.432-1', 'juan.perez@email.cl', '+56934567890', 'GOOGLE', 'PREAPROBADO', 'URGENTE', 'Itaú', 'Crédito Hipotecario', 200000000, 300000000, 100000000, 'Crédito preaprobado', 'INDEPENDIENTE', 'Diego Silva'],
        ['lead-5', 'Ana', 'Torres', '11.222.333-4', 'ana.torres@email.cl', '+56945678901', 'WHATSAPP', 'EVALUACION_BANCARIA', 'MEDIA', 'Scotiabank', 'Crédito de Consumo', 80000000, 120000000, 40000000, 'En evaluación bancaria', 'DEPENDIENTE', 'Valentina Torres'],
        ['lead-6', 'Laura', 'Sánchez', '19.876.543-2', 'laura.sanchez@email.cl', '+56956789012', 'REFERIDO', 'APROBADO', 'ALTA', 'Banco de Chile', 'Crédito Hipotecario', 175000000, 250000000, 75000000, 'Crédito aprobado pendiente', 'INDEPENDIENTE', 'Andrés Pérez'],
        ['lead-7', 'Roberto', 'Silva', '13.456.789-0', 'roberto.silva@email.cl', '+56967890123', 'FACEBOOK', 'DOCS_PENDIENTES', 'MEDIA', 'Santander', 'Crédito Hipotecario', 130000000, 195000000, 65000000, 'Esperando documentos', 'DEPENDIENTE', 'Diego Silva'],
        ['lead-8', 'Fernanda', 'Rojas', '17.654.321-K', 'fernanda.rojas@email.cl', '+56978901234', 'GOOGLE', 'NUEVO_LEAD', 'BAJA', 'Bci', 'Crédito de Consumo', 50000000, 75000000, 25000000, 'Nuevo lead', 'DEPENDIENTE', null],
        ['lead-9', 'Diego', 'Díaz', '14.321.678-9', 'diego.diaz@email.cl', '+56989012345', 'WHATSAPP', 'CONTACTO_INICIAL', 'MEDIA', 'Itaú', 'Crédito Hipotecario', 160000000, 240000000, 80000000, 'Contacto inicial', 'INDEPENDIENTE', 'Carolina Muñoz'],
        ['lead-10', 'Valentina', 'Morales', '16.789.012-3', 'valentina.morales@email.cl', '+56990123456', 'REFERIDO', 'INTERESADO', 'ALTA', 'Scotiabank', 'Crédito Hipotecario', 140000000, 210000000, 70000000, 'Muy interesada en crédito', 'DEPENDIENTE', 'Andrés Pérez'],
    ];
    
    foreach ($leads as $lead) {
        $stmt->execute($lead);
    }
    echo "<div class='success'>10 leads de prueba creados</div>";
    
    echo "<h2>Instalación completada!</h2>";
    echo "<p>La base de datos está lista para usar.</p>";
    echo "<p>Usuarios creados: admin@tuhipotecafacil.cl / demo1234</p>";
    echo "<p>Lead de prueba: RUT 16.567.890-1</p>";
    
} catch (PDOException $e) {
    echo "<div class='error'>Error: " . $e->getMessage() . "</div>";
}

echo "</body></html>";
?>
