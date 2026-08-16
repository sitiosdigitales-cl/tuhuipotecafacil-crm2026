import { createHash, timingSafeEqual } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";
import { crearRespaldo } from "@/lib/backup";
import { supabase } from "@/lib/supabase";

const NOMBRE_BACKUP = /^backup-\d{4}-\d{2}-\d{2}\.json$/;
const ROLES_ADMINISTRATIVOS = new Set(["SUPER_ADMIN", "ADMIN"]);

function apiKeyProcesoValida(request: NextRequest): boolean {
  const configurada = process.env.BACKUP_API_KEY;
  const authorization = request.headers.get("authorization");
  if (
    !configurada ||
    configurada.length < 32 ||
    !authorization?.startsWith("Bearer ")
  ) {
    return false;
  }

  const entregada = authorization.slice("Bearer ".length);
  const hashConfigurada = createHash("sha256").update(configurada).digest();
  const hashEntregada = createHash("sha256").update(entregada).digest();
  return timingSafeEqual(hashConfigurada, hashEntregada);
}

async function autorizarOperacion(request: NextRequest): Promise<Response | null> {
  if (apiKeyProcesoValida(request)) return null;

  const auth = await requireAuth(request);
  if (!auth) return unauthorized();
  if (!ROLES_ADMINISTRATIVOS.has(auth.rol)) return forbidden();
  return null;
}

export async function POST(request: NextRequest) {
  const denegada = await autorizarOperacion(request);
  if (denegada) return denegada;

  try {
    return NextResponse.json(await crearRespaldo());
  } catch (error) {
    console.error("Error al crear respaldo:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo crear el respaldo" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();
  if (!ROLES_ADMINISTRATIVOS.has(auth.rol)) return forbidden();

  try {
    const { data: files, error } = await supabase.storage
      .from("backups")
      .list("", { sortBy: { column: "name", order: "desc" } });

    if (error) {
      console.error("No se pudo listar el bucket de respaldos:", error.message);
      return NextResponse.json(
        { success: false, error: "No se pudo verificar el estado de los respaldos" },
        { status: 500 }
      );
    }

    const backups = (files || [])
      .filter((file) => NOMBRE_BACKUP.test(file.name))
      .map((file) => ({
        nombre: file.name,
        fecha: file.name.replace("backup-", "").replace(".json", ""),
        tamano: file.metadata?.size || 0,
        creado: file.created_at,
      }));

    return NextResponse.json({ success: true, data: backups });
  } catch (error) {
    console.error("Error al listar respaldos:", error);
    return NextResponse.json(
      { success: false, error: "Error al cargar los datos" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const denegada = await autorizarOperacion(request);
  if (denegada) return denegada;

  const fileName = new URL(request.url).searchParams.get("file");
  if (!fileName) {
    return NextResponse.json({ success: false, error: "file requerido" }, { status: 400 });
  }
  if (!NOMBRE_BACKUP.test(fileName)) {
    return NextResponse.json(
      { success: false, error: "Nombre de archivo inválido" },
      { status: 400 }
    );
  }

  const { error } = await supabase.storage.from("backups").remove([fileName]);
  if (error) {
    console.error("No se pudo eliminar el respaldo:", error.message);
    return NextResponse.json(
      { success: false, error: "No se pudo eliminar el respaldo" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
