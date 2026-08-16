import { NextRequest, NextResponse } from "next/server";

import { forbidden, requireAuth, unauthorized } from "@/lib/api-auth";
import { supabase } from "@/lib/supabase";

const ROLES_PORTAL = ["CLIENTE", "SUPER_ADMIN", "ADMIN"];

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();
  if (!ROLES_PORTAL.includes(auth.rol)) return forbidden();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("asignadoa,nombreejecutivo")
    .eq("email", auth.email.toLowerCase())
    .order("creadoen", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (leadError) {
    return NextResponse.json(
      { success: false, error: "No se pudo cargar el asesor" },
      { status: 500 }
    );
  }
  if (!lead) {
    return NextResponse.json(
      { success: false, error: "Solicitud no encontrada" },
      { status: 404 }
    );
  }

  if (lead.asignadoa) {
    const { data: asesor } = await supabase
      .from("usuarios")
      .select("nombre,apellido,email,telefono,cargo")
      .eq("id", lead.asignadoa)
      .eq("estado", "ACTIVO")
      .maybeSingle();

    if (asesor) {
      return NextResponse.json({ success: true, data: asesor });
    }
  }

  const partes = String(lead.nombreejecutivo || "").trim().split(/\s+/);
  const nombre = partes.shift() || "";
  return NextResponse.json({
    success: true,
    data: {
      nombre,
      apellido: partes.join(" "),
      email: "",
      telefono: "",
      cargo: "Asesor Hipotecario Senior",
    },
  });
}
