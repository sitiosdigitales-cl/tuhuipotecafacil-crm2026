import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const DIAS_RETENCION = 5;

export async function POST(request: NextRequest) {
  // Verificar API key para seguridad
  const authHeader = request.headers.get("authorization");
  const backupApiKey = process.env.BACKUP_API_KEY;

  if (!backupApiKey || authHeader !== "Bearer " + backupApiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const fecha = now.toISOString().split("T")[0];
    const fileName = "backup-" + fecha + ".json";

    // 1. Exportar leads
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("*");

    if (leadsError) {
      console.error("Error exportando leads:", leadsError);
    }

    // 2. Exportar documentos
    const { data: documentos, error: docsError } = await supabase
      .from("documentos")
      .select("*");

    if (docsError) {
      console.error("Error exportando documentos:", docsError);
    }

    // 3. Crear objeto de respaldo
    const backup = {
      fecha: now.toISOString(),
      version: "1.0",
      estadisticas: {
        totalLeads: leads?.length || 0,
        totalDocumentos: documentos?.length || 0,
      },
      leads: leads || [],
      documentos: documentos || [],
    };

    // 4. Guardar en Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("backups")
      .upload(fileName, JSON.stringify(backup, null, 2), {
        contentType: "application/json",
      });

    if (uploadError) {
      console.error("Error subiendo backup:", uploadError);
      return NextResponse.json(
        { success: false, error: "Error al guardar respaldo: " + uploadError.message },
        { status: 500 }
      );
    }

    // 5. Eliminar backups antiguos (mantener solo 5 dias)
    await eliminarBackupsAntiguos();

    return NextResponse.json({
      success: true,
      fecha: fecha,
      archivo: fileName,
      estadisticas: backup.estadisticas,
    });
  } catch (error) {
    console.error("Error en backup:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear respaldo" },
      { status: 500 }
    );
  }
}

// GET - Listar respaldos disponibles
export async function GET() {
  try {
    const { data: files, error } = await supabase.storage
      .from("backups")
      .list("", { sortBy: { column: "name", order: "desc" } });

    if (error) {
      return NextResponse.json({ success: true, data: [] });
    }

    const backups = (files || [])
      .filter(function(f) { return f.name.startsWith("backup-") && f.name.endsWith(".json"); })
      .map(function(f) {
        return {
          nombre: f.name,
          fecha: f.name.replace("backup-", "").replace(".json", ""),
          tamano: f.metadata?.size || 0,
          creado: f.created_at,
        };
      });

    return NextResponse.json({ success: true, data: backups });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

// DELETE - Eliminar un respaldo especifico
export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const backupApiKey = process.env.BACKUP_API_KEY;

  if (!backupApiKey || authHeader !== "Bearer " + backupApiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get("file");

  if (!fileName) {
    return NextResponse.json({ error: "file requerido" }, { status: 400 });
  }

  // Validar que sea un archivo de backup
  if (!fileName.startsWith("backup-") || !fileName.endsWith(".json")) {
    return NextResponse.json({ error: "Nombre de archivo invalido" }, { status: 400 });
  }

  const { error } = await supabase.storage.from("backups").remove([fileName]);
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// Eliminar backups antiguos (mantener solo DIAS_RETENCION)
async function eliminarBackupsAntiguos() {
  try {
    const { data: files } = await supabase.storage
      .from("backups")
      .list("", { sortBy: { column: "name", order: "desc" } });

    const backupFiles = (files || [])
      .filter(function(f) { return f.name.startsWith("backup-") && f.name.endsWith(".json"); })
      .sort(function(a, b) { return b.name.localeCompare(a.name); });

    // Si hay mas de DIAS_RETENCION, eliminar los mas antiguos
    if (backupFiles.length > DIAS_RETENCION) {
      const archivosAEliminar = backupFiles
        .slice(DIAS_RETENCION)
        .map(function(f) { return f.name; });

      if (archivosAEliminar.length > 0) {
        await supabase.storage.from("backups").remove(archivosAEliminar);
        console.log("Backups eliminados:", archivosAEliminar.join(", "));
      }
    }
  } catch (error) {
    console.error("Error eliminando backups antiguos:", error);
  }
}