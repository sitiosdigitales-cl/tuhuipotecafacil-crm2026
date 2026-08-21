import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  forbidden,
  requireAuth,
  requireRole,
  unauthorized,
} from "@/lib/api-auth";
import { parseBoundedJson, RequestPayloadError } from "@/lib/request-json";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const TasasBancoSchema = z.object({
  cae: z.number().min(0).max(100),
  tasaBase: z.number().min(0).max(100),
  tasaPreferencial: z.number().min(0).max(100),
}).strict();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAuth(request))) return unauthorized();
  const sesion = await requireRole(request, ["SUPER_ADMIN", "ADMIN", "EJECUTIVO"]);
  if (!sesion) return forbidden();

  let body: unknown;
  try {
    body = await parseBoundedJson(request, 8 * 1024);
  } catch (error) {
    if (error instanceof RequestPayloadError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json({ success: false, error: "Solicitud inválida" }, { status: 400 });
  }

  const parsed = TasasBancoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Tasas inválidas" },
      { status: 400 }
    );
  }

  const { id } = await params;
  const actualizadoEn = new Date().toISOString();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bancos")
    .update({
      cae: parsed.data.cae,
      tasa_base: parsed.data.tasaBase,
      tasa_preferencial: parsed.data.tasaPreferencial,
      updated_at: actualizadoEn,
    })
    .eq("id", id)
    .select("id,nombre,color,estado,tasa_base,tasa_preferencial,cae,updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: "No se pudieron actualizar las tasas" },
      { status: 500 }
    );
  }

  try {
    await supabase.from("auditoria").insert({
      accion: "ACTUALIZAR_TASAS",
      fecha: actualizadoEn,
      id: crypto.randomUUID(),
      modulo: "BANCOS",
      registroid: id,
      registronombre: data.nombre,
      usuarioid: sesion.userId,
      usuarionombre: sesion.email,
      valoranterior: null,
      valornuevo: JSON.stringify(parsed.data),
    });
  } catch {
    // La tasa ya fue actualizada; la auditoría secundaria no cambia el resultado.
  }

  return NextResponse.json({
    success: true,
    data: {
      actualizadoEn: data.updated_at,
      cae: Number(data.cae),
      color: data.color,
      estado: data.estado,
      id: data.id,
      nombre: data.nombre,
      tasaBase: Number(data.tasa_base),
      tasaPreferencial: Number(data.tasa_preferencial),
    },
  });
}
