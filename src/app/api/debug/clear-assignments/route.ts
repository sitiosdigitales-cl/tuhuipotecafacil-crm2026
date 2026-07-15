import { NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";

export async function POST() {
  try {
    const { data: leads, error: fetchError } = await supabase
      .from("leads")
      .select("id")
      .not("nombreejecutivo", "is", null)
      .neq("nombreejecutivo", "");

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({ success: true, message: "No hay leads con ejecutivo asignado", updated: 0 });
    }

    const { error: updateError } = await supabase
      .from("leads")
      .update(toSupabaseColumns({ nombreEjecutivo: "", asignadoA: "" }))
      .in("id", leads.map((l) => l.id));

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Asignacion removida de " + leads.length + " leads", updated: leads.length });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
