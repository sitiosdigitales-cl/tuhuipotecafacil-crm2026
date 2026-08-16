import "server-only";

import { supabase } from "@/lib/supabase";

const MAX_RESPALDOS = 5;

export interface BackupResult {
  success: true;
  fecha: string;
  archivo: string;
  estadisticas: {
    totalLeads: number;
    totalDocumentos: number;
  };
}

async function eliminarRespaldosExcedentes() {
  try {
    const { data: files, error } = await supabase.storage
      .from("backups")
      .list("", { sortBy: { column: "name", order: "desc" } });

    if (error) {
      console.error("No se pudo aplicar la retención de respaldos:", error.message);
      return;
    }

    const archivosAEliminar = (files || [])
      .filter((file) => /^backup-\d{4}-\d{2}-\d{2}\.json$/.test(file.name))
      .sort((a, b) => b.name.localeCompare(a.name))
      .slice(MAX_RESPALDOS)
      .map((file) => file.name);

    if (!archivosAEliminar.length) return;
    const { error: removeError } = await supabase.storage
      .from("backups")
      .remove(archivosAEliminar);
    if (removeError) {
      console.error("No se pudo aplicar la retención de respaldos:", removeError.message);
    }
  } catch (error) {
    console.error("No se pudo aplicar la retención de respaldos:", error);
  }
}

export async function crearRespaldo(): Promise<BackupResult> {
  const now = new Date();
  const fecha = now.toISOString().split("T")[0];
  const archivo = `backup-${fecha}.json`;

  const [leadsResult, documentosResult] = await Promise.all([
    supabase.from("leads").select("*"),
    supabase.from("documentos").select("*"),
  ]);

  if (leadsResult.error || documentosResult.error) {
    if (leadsResult.error) {
      console.error("No se pudieron exportar leads:", leadsResult.error.message);
    }
    if (documentosResult.error) {
      console.error("No se pudieron exportar documentos:", documentosResult.error.message);
    }
    throw new Error("No se pudieron leer todos los datos del respaldo");
  }

  const backup = {
    fecha: now.toISOString(),
    version: "1.0",
    estadisticas: {
      totalLeads: leadsResult.data?.length ?? 0,
      totalDocumentos: documentosResult.data?.length ?? 0,
    },
    leads: leadsResult.data ?? [],
    documentos: documentosResult.data ?? [],
  };

  const { error: uploadError } = await supabase.storage
    .from("backups")
    .upload(archivo, JSON.stringify(backup, null, 2), {
      contentType: "application/json",
      upsert: true,
    });

  if (uploadError) {
    console.error("No se pudo guardar el respaldo:", uploadError.message);
    throw new Error("No se pudo guardar el respaldo");
  }

  await eliminarRespaldosExcedentes();

  return {
    success: true,
    fecha,
    archivo,
    estadisticas: backup.estadisticas,
  };
}
