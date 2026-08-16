import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { requireAuth, requireRole, unauthorized, forbidden } from "@/lib/api-auth";
import { parseBoundedJson, RequestPayloadError } from "@/lib/request-json";
import { EditarUsuarioSchema } from "@/modulos/usuarios/validaciones";

const MAX_USUARIO_PAYLOAD_BYTES = 8 * 1024;

function invalidPayload(error: unknown) {
  if (error instanceof RequestPayloadError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status }
    );
  }
  return NextResponse.json(
    { success: false, error: "Solicitud inválida" },
    { status: 400 }
  );
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!auth) return unauthorized();
  const vistaAdministrativa = ["SUPER_ADMIN", "ADMIN"].includes(auth.rol);
  if (!vistaAdministrativa && !["EJECUTIVO", "AGENTE"].includes(auth.rol)) {
    return forbidden();
  }

  try {
    const { id } = await params;
    if (auth.rol === "AGENTE" && id !== auth.userId) return forbidden();

    let query = supabase
      .from("usuarios")
      .select("id,nombre,apellido,email,telefono,rol,estado,cargo,creadoen")
      .eq("id", id);
    if (auth.rol === "EJECUTIVO") {
      query = query.eq("estado", "ACTIVO").neq("rol", "CLIENTE");
    }
    const { data, error } = await query.single();
    if (error || !data) return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });

    const usuario: Record<string, unknown> = {
      id: data.id,
      nombre: data.nombre,
      apellido: data.apellido,
      email: data.email,
      rol: data.rol,
      estado: data.estado,
      cargo: data.cargo || null,
      ultimoAcceso: null,
      creadoEn: data.creadoen,
    };
    if (vistaAdministrativa) usuario.telefono = data.telefono;

    return NextResponse.json({ success: true, data: usuario });
  } catch {
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = requireRole(request, ["SUPER_ADMIN"]);
  if (!user) return forbidden();

  let rawBody: unknown;
  try {
    rawBody = await parseBoundedJson(request, MAX_USUARIO_PAYLOAD_BYTES);
  } catch (error) {
    return invalidPayload(error);
  }

  const parsedBody = EditarUsuarioSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsedBody.error.issues[0]?.message ?? "Datos de usuario inválidos",
      },
      { status: 400 }
    );
  }

  try {
    const { id } = await params;
    const body = parsedBody.data;

    const updateData: Record<string, unknown> = {};
    if (body.nombre !== undefined) updateData.nombre = body.nombre;
    if (body.apellido !== undefined) updateData.apellido = body.apellido;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.telefono !== undefined) updateData.telefono = body.telefono;
    if (body.cargo !== undefined) updateData.cargo = body.cargo;
    if (body.rol !== undefined) updateData.rol = body.rol;
    if (body.estado !== undefined) updateData.estado = body.estado;

    if (body.password !== undefined) {
      updateData.password = await bcrypt.hash(body.password, 12);
    }

    const { data, error } = await supabase
      .from("usuarios")
      .update(toSupabaseColumns(updateData))
      .eq("id", id)
      .select("id,nombre,apellido,email,telefono,rol,estado,creadoen")
      .single();

    if (error) return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = requireRole(request, ["SUPER_ADMIN"]);
  if (!user) return forbidden();
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get("hard") === "true";

    if (hardDelete) {
      // Eliminación real de la base de datos
      const { error } = await supabase.from("usuarios").delete().eq("id", id);
      if (error) return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
    } else {
      // Soft delete: cambiar estado a INACTIVO
      const { error } = await supabase
        .from("usuarios")
        .update(toSupabaseColumns({ estado: "INACTIVO" }))
        .eq("id", id);
      if (error) return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}
