import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Test with anon key
  const anonClient = createClient(url || "", anonKey || "");
  const { data: anonTest, error: anonError } = await anonClient
    .from("leads")
    .select("id")
    .limit(1);

  // Test with service key
  const serviceClient = createClient(url || "", serviceKey || anonKey || "");
  const { data: serviceTest, error: serviceError } = await serviceClient
    .from("leads")
    .select("id")
    .limit(1);

  // Test insert with service key
  const { data: insertTest, error: insertError } = await serviceClient
    .from("leads")
    .insert({
      id: crypto.randomUUID(),
      nombre: "Debug Test",
      apellido: "",
      rut: `debug-${Date.now()}`,
      origen: "debug",
      etapa: "NUEVO_LEAD",
      prioridad: "MEDIA",
      situacionlaboral: "DEPENDIENTE",
      endicom: false,
      diasenetapa: 0,
      creadoen: new Date().toISOString(),
    })
    .select()
    .single();

  return NextResponse.json({
    config: {
      url: url ? "configured" : "MISSING",
      anonKey: anonKey ? "configured" : "MISSING",
      serviceKey: serviceKey ? "configured" : "MISSING",
    },
    anonQuery: { success: !anonError, error: anonError?.message, data: anonTest },
    serviceQuery: { success: !serviceError, error: serviceError?.message, data: serviceTest },
    serviceInsert: { success: !insertError, error: insertError?.message, data: insertTest },
  });
}

export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const serviceClient = createClient(url || "", serviceKey || anonKey || "");

  // Obtener leads con ejecutivo asignado
  const { data: leads, error: fetchError } = await serviceClient
    .from("leads")
    .select("id")
    .not("nombreejecutivo", "is", null)
    .neq("nombreejecutivo", "");

  if (fetchError) {
    return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
  }

  if (!leads || leads.length === 0) {
    return NextResponse.json({ success: true, message: "No hay leads con ejecutivo", updated: 0 });
  }

  // Quitar asignacion de todos
  const { error: updateError } = await serviceClient
    .from("leads")
    .update({ nombreejecutivo: null })
    .in("id", leads.map((l) => l.id));

  if (updateError) {
    return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, updated: leads.length });
}
