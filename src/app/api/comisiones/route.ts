import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseArray } from "@/lib/supabase";
import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";
import { parseBoundedJson, RequestPayloadError } from "@/lib/request-json";
import { COMISIONES_PERMISOS } from "@/modulos/comisiones/config";
import { CrearComisionSchema } from "@/modulos/comisiones/validaciones";

const MAX_COMISION_PAYLOAD_BYTES = 8 * 1024;

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();
  if (!COMISIONES_PERMISOS.ver.some((rol) => rol === auth.rol)) {
    return forbidden();
  }
  try {
    const { data, error } = await supabase
      .from("comisiones")
      .select("*")
      .order("creadoen", { ascending: false });
    if (error) {
      console.error("Fallo la consulta:", error.message);
      return NextResponse.json({ success: false, error: "No se pudieron cargar los datos" }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: fromSupabaseArray(data || []) });
  } catch (e) {
    console.error("Error inesperado:", e);
    return NextResponse.json({ success: false, error: "Error al cargar los datos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();
  if (!COMISIONES_PERMISOS.crear.some((rol) => rol === auth.rol)) {
    return forbidden();
  }
  try {
    const rawBody = await parseBoundedJson(request, MAX_COMISION_PAYLOAD_BYTES);
    const parsedBody = CrearComisionSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json(
        { success: false, error: "Datos de comisión inválidos" },
        { status: 400 }
      );
    }
    const body = parsedBody.data;
    const { montoTotal, tasaComision } = body;

    // El total lo calcula el servidor. Antes se hacía `...body`, así que la
    // cifra que se paga venía del cliente: bastaba mandar el comisionTotal que
    // uno quisiera. Lo mismo con `pagado`, que se podía enviar en true y dar
    // una comisión por saldada sin que nadie la pagara.
    const comisionTotal = Math.round(montoTotal * (tasaComision / 100));

    // Lista explícita de campos. Un spread del cuerpo deja escribir cualquier
    // columna de la tabla, incluidas las que el servidor debe controlar.
    const { data, error } = await supabase
      .from("comisiones")
      .insert(toSupabaseColumns({
        id: crypto.randomUUID(),
        ejecutivoId: body.ejecutivoId ?? null,
        ejecutivoNombre: body.ejecutivoNombre ?? null,
        mes: body.mes ?? null,
        anio: body.anio ?? null,
        creditosAprobados: Number(body.creditosAprobados) || 0,
        montoTotal,
        tasaComision,
        comisionTotal,
        pagado: false,
        creadoEn: new Date().toISOString(),
      }))
      .select().single();

    if (error) {
      console.error("Error al crear comisión:", error.message);
      return NextResponse.json({ success: false, error: "Error al crear" }, { status: 500 });
    }
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof RequestPayloadError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json({ success: false, error: "Error al crear" }, { status: 500 });
  }
}
