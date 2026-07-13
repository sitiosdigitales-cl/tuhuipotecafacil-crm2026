import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { requireRole, forbidden } from "@/lib/api-auth";

// Endpoint para actualizar contraseñas de todos los usuarios a "admin123"
// Solo SUPER_ADMIN
export async function POST(request: NextRequest) {
  const user = requireRole(request, ["SUPER_ADMIN"]);
  if (!user) return forbidden();
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    // Obtener todos los usuarios
    const { data: usuarios, error: fetchError } = await supabase
      .from("usuarios")
      .select("id, email");

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    const resultados = [];

    for (const usuario of usuarios || []) {
      const { error } = await supabase
        .from("usuarios")
        .update({ password: hashedPassword })
        .eq("id", usuario.id);

      resultados.push({
        email: usuario.email,
        status: error ? "error" : "actualizado",
        error: error?.message,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Contraseñas actualizadas a: admin123",
      resultados,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error al actualizar contraseñas" },
      { status: 500 }
    );
  }
}
