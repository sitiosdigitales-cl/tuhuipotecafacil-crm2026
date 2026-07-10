import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";
import { requireAuth, unauthorized } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  if (!requireAuth(request)) return unauthorized();
  try {
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get("usuarioId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const soloNoLeidas = searchParams.get("noLeidas") === "true";

    let query = supabase
      .from("notificaciones")
      .select("*")
      .order("creadoen", { ascending: false })
      .limit(limit);

    if (usuarioId) {
      query = query.eq("usuarioid", usuarioId);
    }
    if (soloNoLeidas) {
      query = query.eq("leida", false);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ success: true, data: [] });

    const notificaciones = (data || []).map((n: any) => ({
      id: n.id,
      tipo: n.tipo,
      titulo: n.titulo,
      descripcion: n.descripcion,
      leida: n.leida,
      fecha: n.creadoen,
      usuarioId: n.usuarioid,
      leadId: n.leadid,
      accionUrl: n.accionurl,
    }));

    return NextResponse.json({ success: true, data: notificaciones });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
  if (!requireAuth(request)) return unauthorized();
  try {
    const body = await request.json();
    const { tipo, titulo, descripcion, usuarioId, leadId, accionUrl } = body;

    if (!tipo || !titulo) {
      return NextResponse.json({ success: false, error: "tipo y titulo requeridos" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("notificaciones")
      .insert(toSupabaseColumns({
        id: crypto.randomUUID(),
        tipo,
        titulo,
        descripcion: descripcion || "",
        leida: false,
        usuarioId: usuarioId || null,
        leadId: leadId || null,
        accionUrl: accionUrl || null,
        creadoEn: new Date().toISOString(),
      }))
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, error: "Error al crear notificación" }, { status: 500 });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Error al crear notificación" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!requireAuth(request)) return unauthorized();
  try {
    const body = await request.json();
    const { id, leida, marcarTodas } = body;

    if (marcarTodas) {
      const { error } = await supabase
        .from("notificaciones")
        .update({ leida: true })
        .eq("leida", false);
      if (error) return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "id requerido" }, { status: 400 });
    }

    const { error } = await supabase
      .from("notificaciones")
      .update({ leida: leida ?? true })
      .eq("id", id);

    if (error) return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!requireAuth(request)) return unauthorized();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "id requerido" }, { status: 400 });
    }

    const { error } = await supabase.from("notificaciones").delete().eq("id", id);
    if (error) return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
  }
}
