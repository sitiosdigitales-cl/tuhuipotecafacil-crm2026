import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function mapEjecucion(row: any) {
  return {
    id: row.id,
    triggerId: row.trigger_id,
    leadId: row.lead_id,
    leadNombre: row.lead_nombre,
    leadEmail: row.lead_email,
    estado: row.estado,
    accionesEjecutadas: row.acciones_ejecutadas,
    contexto: row.contexto,
    duracionTotalMs: row.duracion_total_ms,
    errorMensaje: row.error_mensaje,
    ejecutadoEn: row.ejecutado_en,
    creadoEn: row.creado_en,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from("trigger_ejecuciones")
      .select("*", { count: "exact" })
      .eq("trigger_id", id)
      .order("ejecutado_en", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching historial:", error);
      return NextResponse.json({ success: true, data: [], total: 0 });
    }

    const { data: stats } = await supabase
      .from("trigger_ejecuciones")
      .select("estado")
      .eq("trigger_id", id);

    const totalEjecuciones = stats?.length || 0;
    const exitosas = stats?.filter((s) => s.estado === "EXITOSO").length || 0;
    const fallidas = stats?.filter((s) => s.estado === "FALLIDO").length || 0;
    const parciales = stats?.filter((s) => s.estado === "PARCIAL").length || 0;

    return NextResponse.json({
      success: true,
      data: (data || []).map(mapEjecucion),
      total: count || 0,
      page,
      limit,
      stats: {
        total: totalEjecuciones,
        exitosas,
        fallidas,
        parciales,
        tasaExito: totalEjecuciones > 0 ? Math.round((exitosas / totalEjecuciones) * 100) : 0,
      },
    });
  } catch (err) {
    console.error("Error in historial GET:", err);
    return NextResponse.json({ success: true, data: [], total: 0 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const ejecucion = {
      id: crypto.randomUUID(),
      trigger_id: id,
      lead_id: body.leadId || null,
      lead_nombre: body.leadNombre || null,
      lead_email: body.leadEmail || null,
      estado: body.estado || "EXITOSO",
      acciones_ejecutadas: JSON.stringify(body.accionesEjecutadas || []),
      contexto: JSON.stringify(body.contexto || {}),
      duracion_total_ms: body.duracionTotalMs || 0,
      error_mensaje: body.errorMensaje || null,
      ejecutado_en: new Date().toISOString(),
      creado_en: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("trigger_ejecuciones")
      .insert(ejecucion)
      .select()
      .single();

    if (error) {
      console.error("Error creating ejecucion:", error);
      return NextResponse.json({ success: false, error: "Error al registrar ejecucion" }, { status: 500 });
    }

    const { data: triggerData } = await supabase
      .from("triggers")
      .select("ejecuciones, exitosos, fallidos")
      .eq("id", id)
      .single();

    if (triggerData) {
      const updates: Record<string, any> = {
        ejecuciones: (triggerData.ejecuciones || 0) + 1,
        ultimo_ejecucion: new Date().toISOString(),
      };

      if (body.estado === "EXITOSO") {
        updates.exitosos = (triggerData.exitosos || 0) + 1;
      } else if (body.estado === "FALLIDO") {
        updates.fallidos = (triggerData.fallidos || 0) + 1;
      }

      await supabase.from("triggers").update(updates).eq("id", id);
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    console.error("Error in historial POST:", err);
    return NextResponse.json({ success: false, error: "Error al registrar ejecucion" }, { status: 500 });
  }
}