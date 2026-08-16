import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, fromSupabaseArray } from "@/lib/supabase";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { despacharNotificacion } from "@/lib/dispatcher-notificaciones";

export async function GET(request: NextRequest) {
  if (!(await requireAuth(request))) return unauthorized();
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId");
    let query = supabase.from("tareas").select("*");
    if (leadId) query = query.eq("leadid", leadId);
    const { data, error } = await query;
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
  if (!(await requireAuth(request))) return unauthorized();
  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from("tareas")
      .insert(toSupabaseColumns({
        id: crypto.randomUUID(),
        titulo: body.titulo,
        descripcion: body.descripcion || null,
        estado: body.estado || "PENDIENTE",
        tipo: body.tipo || "SEGUIMIENTO",
        prioridad: body.prioridad || "MEDIA",
        asignadoA: body.asignadoA || null,
        nombreEjecutivo: body.nombreEjecutivo || null,
        leadId: body.leadId || null,
        leadNombre: body.leadNombre || null,
        fechaVencimiento: body.fechaVencimiento || null,
        creadoEn: new Date().toISOString(),
      }))
      .select()
      .single();
    if (error) return NextResponse.json({ success: false, error: "Error al crear tarea" }, { status: 500 });

    // Notificacion si hay asignado
    if (body.asignadoA || body.nombreEjecutivo) {
      despacharNotificacion({
        evento: "tarea_asignada",
        leadId: body.leadId || undefined,
        titulo: "Tarea asignada",
        descripcion: body.titulo,
        accionUrl: "/tareas",
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Error al crear tarea" }, { status: 500 });
  }
}
