import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";
import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";
import { parseBoundedJson, RequestPayloadError } from "@/lib/request-json";
import { COMISIONES_PERMISOS } from "@/modulos/comisiones/config";
import { ActualizarComisionSchema } from "@/modulos/comisiones/validaciones";

const MAX_COMISION_PAYLOAD_BYTES = 8 * 1024;

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();
  if (!COMISIONES_PERMISOS.editar.some((rol) => rol === auth.rol)) {
    return forbidden();
  }
  const { id } = await params;

  let rawBody: unknown;
  try {
    rawBody = await parseBoundedJson(request, MAX_COMISION_PAYLOAD_BYTES);
  } catch (error) {
    if (error instanceof RequestPayloadError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json({ success: false, error: "Solicitud inválida" }, { status: 400 });
  }

  const parsedBody = ActualizarComisionSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json(
      { success: false, error: "Datos de comisión inválidos" },
      { status: 400 }
    );
  }

  try {
    const updateData = { ...parsedBody.data } as Record<string, unknown>;
    if (
      parsedBody.data.montoTotal !== undefined ||
      parsedBody.data.tasaComision !== undefined
    ) {
      let montoTotal = parsedBody.data.montoTotal;
      let tasaComision = parsedBody.data.tasaComision;

      if (montoTotal === undefined || tasaComision === undefined) {
        const { data: actual, error: lookupError } = await supabase
          .from("comisiones")
          .select("montototal,tasacomision")
          .eq("id", id)
          .single();
        if (lookupError || !actual) {
          return NextResponse.json(
            { success: false, error: "No se pudo cargar la comisión" },
            { status: 500 }
          );
        }
        montoTotal ??= Number(actual.montototal);
        tasaComision ??= Number(actual.tasacomision);
      }

      if (!Number.isFinite(montoTotal) || !Number.isFinite(tasaComision)) {
        return NextResponse.json(
          { success: false, error: "La comisión almacenada no es válida" },
          { status: 500 }
        );
      }
      updateData.comisionTotal = Math.round(
        montoTotal * (tasaComision / 100)
      );
    }

    const { error } = await supabase
      .from("comisiones")
      .update(toSupabaseColumns(updateData))
      .eq("id", id);
    if (error) return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();
  if (!COMISIONES_PERMISOS.eliminar.some((rol) => rol === auth.rol)) {
    return forbidden();
  }
  const { id } = await params;
  try {
    const { error } = await supabase.from("comisiones").delete().eq("id", id);
    if (error) return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
  }
}
