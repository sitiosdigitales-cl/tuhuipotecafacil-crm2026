import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { requireAuth, requireRole, unauthorized, forbidden } from "@/lib/api-auth";

// `public.pipeline_stages` es la unica fuente. Antes convivia con un arreglo en
// memoria del proceso: en Vercel esa memoria no persiste ni se comparte entre
// instancias, asi que la interfaz informaba exito y el cambio desaparecia al
// recargar o al caer en otra instancia.

const COLUMNAS = "id,nombre,color,orden,activa";

// Etapas que el flujo hipotecario necesita para funcionar. No se borran.
const ETAPAS_SISTEMA = ["NUEVO_LEAD", "CLIENTE_FINALIZADO"];

const ColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, "El color debe ser hexadecimal de seis dígitos");

const CrearEtapaSchema = z
  .object({
    nombre: z.string().trim().min(1).max(60),
    color: ColorSchema.optional(),
    orden: z.number().int().positive().optional(),
  })
  .strict();

const ActualizarEtapaSchema = z
  .object({
    id: z.string().trim().min(1),
    nombre: z.string().trim().min(1).max(60).optional(),
    color: ColorSchema.optional(),
    orden: z.number().int().positive().optional(),
    activa: z.boolean().optional(),
  })
  .strict()
  .refine(
    (valor) =>
      valor.nombre !== undefined ||
      valor.color !== undefined ||
      valor.orden !== undefined ||
      valor.activa !== undefined,
    { message: "No hay campos que actualizar" },
  );

/**
 * Deriva el id desde el nombre. Puede quedar vacio —un nombre de solo simbolos
 * o de solo acentos se queda sin caracteres validos—, y en ese caso hay que
 * rechazar en vez de insertar una fila con id "".
 */
function idDesdeNombre(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function esViolacionDeUnicidad(error: unknown): boolean {
  return Boolean(
    error && typeof error === "object" && "code" in error && error.code === "23505",
  );
}

function errorDeServidor(mensaje: string) {
  return NextResponse.json({ success: false, error: mensaje }, { status: 500 });
}

export async function GET(request: NextRequest) {
  // Los metodos de escritura ya pedian rol; la lectura no pedia nada y
  // devolvia el flujo completo del CRM a cualquiera.
  if (!(await requireAuth(request))) return unauthorized();

  const { data, error } = await supabase
    .from("pipeline_stages")
    .select(COLUMNAS)
    .order("orden", { ascending: true });

  if (error) {
    console.error("Error en GET /api/pipeline/stages:", error.message);
    return errorDeServidor("No se pudieron cargar las etapas");
  }

  // Se devuelve lo que hay. Rellenar los huecos desde un arreglo estatico era
  // lo que resucitaba las etapas recien eliminadas.
  return NextResponse.json({ success: true, data: data ?? [] });
}

export async function POST(request: NextRequest) {
  if (!(await requireRole(request, ["SUPER_ADMIN", "ADMIN"]))) {
    return forbidden();
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Solicitud inválida" }, { status: 400 });
  }

  const parseado = CrearEtapaSchema.safeParse(cuerpo);
  if (!parseado.success) {
    return NextResponse.json(
      { success: false, error: parseado.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  const { nombre, color, orden } = parseado.data;
  const id = idDesdeNombre(nombre);
  if (!id) {
    return NextResponse.json(
      { success: false, error: "El nombre debe incluir al menos una letra o un número" },
      { status: 400 },
    );
  }

  try {
    // El orden sale de la base, no del largo de un arreglo local: dos
    // instancias con memorias distintas calculaban el mismo numero y chocaban
    // contra UNIQUE (orden).
    let ordenFinal = orden;
    if (ordenFinal === undefined) {
      const { data: ultima, error: errorOrden } = await supabase
        .from("pipeline_stages")
        .select("orden")
        .order("orden", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (errorOrden) {
        console.error("Error calculando el orden:", errorOrden.message);
        return errorDeServidor("No se pudo calcular el orden de la etapa");
      }
      ordenFinal = (ultima?.orden ?? 0) + 1;
    }

    const { data, error } = await supabase
      .from("pipeline_stages")
      .insert({ id, nombre, color: color ?? "#64748B", orden: ordenFinal, activa: true })
      .select(COLUMNAS)
      .single();

    if (error) {
      if (esViolacionDeUnicidad(error)) {
        return NextResponse.json(
          { success: false, error: "Ya existe una etapa con ese nombre o ese orden" },
          { status: 409 },
        );
      }
      console.error("Error en POST /api/pipeline/stages:", error.message);
      return errorDeServidor("No se pudo crear la etapa");
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error(
      "Error en POST /api/pipeline/stages:",
      error instanceof Error ? error.message : "Error desconocido",
    );
    return errorDeServidor("No se pudo crear la etapa");
  }
}

export async function PUT(request: NextRequest) {
  if (!(await requireRole(request, ["SUPER_ADMIN", "ADMIN"]))) {
    return forbidden();
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Solicitud inválida" }, { status: 400 });
  }

  const parseado = ActualizarEtapaSchema.safeParse(cuerpo);
  if (!parseado.success) {
    return NextResponse.json(
      { success: false, error: parseado.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  const { id, ...campos } = parseado.data;

  // Solo los campos recibidos. Antes se enviaban los cuatro siempre, asi que
  // cambiar el color escribia `nombre: undefined` sobre la fila.
  const cambios: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (campos.nombre !== undefined) cambios.nombre = campos.nombre;
  if (campos.color !== undefined) cambios.color = campos.color;
  if (campos.orden !== undefined) cambios.orden = campos.orden;
  if (campos.activa !== undefined) cambios.activa = campos.activa;

  try {
    const { data, error } = await supabase
      .from("pipeline_stages")
      .update(cambios)
      .eq("id", id)
      .select(COLUMNAS);

    if (error) {
      if (esViolacionDeUnicidad(error)) {
        return NextResponse.json(
          { success: false, error: "Ese orden ya lo ocupa otra etapa" },
          { status: 409 },
        );
      }
      console.error("Error en PUT /api/pipeline/stages:", error.message);
      return errorDeServidor("No se pudo actualizar la etapa");
    }

    // Cero filas significa que la etapa no existe. Responder exito era lo que
    // hacia que la interfaz conservara un cambio que la base nunca guardo.
    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "La etapa no existe" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error) {
    console.error(
      "Error en PUT /api/pipeline/stages:",
      error instanceof Error ? error.message : "Error desconocido",
    );
    return errorDeServidor("No se pudo actualizar la etapa");
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await requireRole(request, ["SUPER_ADMIN", "ADMIN"]))) {
    return forbidden();
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ success: false, error: "ID requerido" }, { status: 400 });
  }

  if (ETAPAS_SISTEMA.includes(id)) {
    return NextResponse.json(
      { success: false, error: "No se pueden eliminar etapas del sistema" },
      { status: 400 },
    );
  }

  try {
    const { count, error: errorLeads } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("etapa", id);

    // Si la comprobacion falla no se puede saber si hay leads: no se borra.
    if (errorLeads) {
      console.error("Error comprobando leads de la etapa:", errorLeads.message);
      return errorDeServidor("No se pudo comprobar si la etapa tiene leads");
    }

    if (count && count > 0) {
      return NextResponse.json(
        { success: false, error: `No se puede eliminar: hay ${count} leads en esta etapa` },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("pipeline_stages")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) {
      console.error("Error en DELETE /api/pipeline/stages:", error.message);
      return errorDeServidor("No se pudo eliminar la etapa");
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "La etapa no existe" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Error en DELETE /api/pipeline/stages:",
      error instanceof Error ? error.message : "Error desconocido",
    );
    return errorDeServidor("No se pudo eliminar la etapa");
  }
}
