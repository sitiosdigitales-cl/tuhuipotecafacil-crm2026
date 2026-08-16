import { NextRequest, NextResponse } from "next/server";
import { supabase, fromSupabaseArray } from "@/lib/supabase";
import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";
import { puedeAccederLead } from "@/lib/permisos-lead";
import type { TokenPayload } from "@/lib/jwt";
import { documentWithProxyUrl } from "@/lib/document-storage";

async function obtenerLead(leadId: string) {
  const { data, error } = await supabase
    .from("leads")
    .select("id,email,asignadoa")
    .eq("id", leadId)
    .single();

  return error ? null : data;
}

async function obtenerIdsLeadsPermitidos(
  auth: TokenPayload
): Promise<string[] | null> {
  if (["SUPER_ADMIN", "ADMIN", "EJECUTIVO"].includes(auth.rol)) {
    return null;
  }

  let query = supabase.from("leads").select("id");
  if (auth.rol === "AGENTE") {
    query = query.eq("asignadoa", auth.userId);
  } else if (auth.rol === "CLIENTE") {
    query = query.eq("email", auth.email.toLowerCase());
  } else {
    return [];
  }

  const { data, error } = await query;
  if (error) throw new Error("No se pudo resolver la cartera de documentos");
  return (data ?? []).map((lead) => lead.id);
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("leadId");

    if (leadId) {
      const lead = await obtenerLead(leadId);
      if (!lead) {
        return NextResponse.json(
          { success: false, error: "Lead no encontrado" },
          { status: 404 }
        );
      }
      if (!puedeAccederLead(auth, lead)) return forbidden();
    }

    let query = supabase.from("documentos").select("*");
    if (leadId) {
      query = query.eq("leadid", leadId);
    } else {
      const idsPermitidos = await obtenerIdsLeadsPermitidos(auth);
      if (idsPermitidos !== null) {
        if (idsPermitidos.length === 0) {
          return NextResponse.json({ success: true, data: [] });
        }
        query = query.in("leadid", idsPermitidos);
      }
    }

    const { data, error } = await query;
    if (error) {
      console.error("Fallo la consulta:", error.message);
      return NextResponse.json({ success: false, error: "No se pudieron cargar los datos" }, { status: 500 });
    }
    const documents = fromSupabaseArray(data || []).map(documentWithProxyUrl);
    return NextResponse.json({ success: true, data: documents });
  } catch (e) {
    console.error("Error inesperado:", e);
    return NextResponse.json({ success: false, error: "Error al cargar los datos" }, { status: 500 });
  }
}
