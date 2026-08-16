import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { requireAuth, requireRole, unauthorized, forbidden } from "@/lib/api-auth";
import { parseBoundedJson, RequestPayloadError } from "@/lib/request-json";
import { EditarUsuarioSchema } from "@/modulos/usuarios/validaciones";
import { obtenerModoSupabaseAuth } from "@/lib/supabase-auth";
import {
  actualizarIdentidadAdministrada,
  crearIdentidadAdministrada,
  eliminarIdentidadAdministrada,
  type IdentityMutationResult,
} from "@/lib/supabase-auth-accounts";

const MAX_USUARIO_PAYLOAD_BYTES = 8 * 1024;

interface UsuarioPersistido extends Record<string, unknown> {
  id: string;
  email: string;
  estado: string;
  auth_user_id?: string | null;
}

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

function isUniqueConstraintError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505",
  );
}

function identityMutationError(result: IdentityMutationResult) {
  if (result.status === "email_exists") {
    return NextResponse.json(
      { success: false, error: "Email ya registrado" },
      { status: 409 },
    );
  }
  if (result.status === "weak_password") {
    return NextResponse.json(
      { success: false, error: "La contraseña no cumple la política de acceso" },
      { status: 400 },
    );
  }
  return null;
}

async function revertirUsuario(id: string, values: Record<string, unknown>) {
  if (Object.keys(values).length === 0) return;
  const { error } = await supabase
    .from("usuarios")
    .update(toSupabaseColumns(values))
    .eq("id", id);
  if (error) throw new Error("No se pudo revertir la cuenta CRM");
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
    const authMode = obtenerModoSupabaseAuth();

    if (
      id === user.userId &&
      ((body.rol !== undefined && body.rol !== user.rol) ||
        (body.estado !== undefined && body.estado !== "ACTIVO"))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "No puedes degradar ni inhabilitar tu propia cuenta",
        },
        { status: 409 }
      );
    }

    const currentResult = authMode === "legacy"
      ? await supabase
          .from("usuarios")
          .select("id,nombre,apellido,email,telefono,rol,estado,cargo,creadoen,password")
          .eq("id", id)
          .single()
      : await supabase
          .from("usuarios")
          .select("id,nombre,apellido,email,telefono,rol,estado,cargo,creadoen,password,auth_user_id,auth_migrated_at")
          .eq("id", id)
          .single();
    const current = currentResult.data as UsuarioPersistido | null;
    const currentError = currentResult.error;
    if (currentError || !current) {
      return NextResponse.json(
        { success: false, error: "No encontrado" },
        { status: 404 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (body.nombre !== undefined) updateData.nombre = body.nombre;
    if (body.apellido !== undefined) updateData.apellido = body.apellido;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.telefono !== undefined) updateData.telefono = body.telefono;
    if (body.cargo !== undefined) updateData.cargo = body.cargo;
    if (body.rol !== undefined) updateData.rol = body.rol;
    if (body.estado !== undefined) updateData.estado = body.estado;

    const currentAuthUserId =
      typeof current.auth_user_id === "string" ? current.auth_user_id : null;
    let authUserId = currentAuthUserId;
    let createdAuthUserId: string | null = null;

    if (
      body.password !== undefined &&
      authMode !== "legacy" &&
      !authUserId
    ) {
      const identity = await crearIdentidadAdministrada({
        crmUserId: id,
        email: body.email ?? current.email,
        password: body.password,
        active: (body.estado ?? current.estado) === "ACTIVO",
      });
      if (identity.status !== "created") {
        const response = identityMutationError(identity);
        if (response) return response;
      } else {
        authUserId = identity.user.id;
        createdAuthUserId = identity.user.id;
        updateData.auth_user_id = identity.user.id;
        updateData.auth_migrated_at = new Date().toISOString();
        updateData.password = null;
      }
    } else if (body.password !== undefined && !authUserId) {
      updateData.password = await bcrypt.hash(body.password, 12);
    }

    const rollbackData: Record<string, unknown> = {};
    for (const key of Object.keys(updateData)) {
      rollbackData[key] = current[key];
    }

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from("usuarios")
        .update(toSupabaseColumns(updateData))
        .eq("id", id);
      if (error) {
        if (createdAuthUserId) {
          try {
            await eliminarIdentidadAdministrada(createdAuthUserId);
          } catch {}
        }
        if (isUniqueConstraintError(error)) {
          return NextResponse.json(
            { success: false, error: "Email ya registrado" },
            { status: 409 },
          );
        }
        return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
      }
    }

    if (authUserId && !createdAuthUserId) {
      let identityResult: IdentityMutationResult;
      try {
        identityResult = await actualizarIdentidadAdministrada({
          authUserId,
          email: body.email,
          password: body.password,
          active: body.estado === undefined ? undefined : body.estado === "ACTIVO",
        });
      } catch (error) {
        await revertirUsuario(id, rollbackData);
        throw error;
      }
      const identityError = identityMutationError(identityResult);
      if (identityError) {
        await revertirUsuario(id, rollbackData);
        return identityError;
      }
    }

    const { data, error } = await supabase
      .from("usuarios")
      .select("id,nombre,apellido,email,telefono,rol,estado,creadoen")
      .eq("id", id)
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
    if (id === user.userId) {
      return NextResponse.json(
        { success: false, error: "No puedes eliminar tu propia cuenta" },
        { status: 409 }
      );
    }
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get("hard") === "true";
    const authMode = obtenerModoSupabaseAuth();
    const currentResult = authMode === "legacy"
      ? await supabase
          .from("usuarios")
          .select("id,estado")
          .eq("id", id)
          .single()
      : await supabase
          .from("usuarios")
          .select("id,estado,auth_user_id")
          .eq("id", id)
          .single();
    const current = currentResult.data as UsuarioPersistido | null;
    const currentError = currentResult.error;
    if (currentError || !current) {
      return NextResponse.json(
        { success: false, error: "No encontrado" },
        { status: 404 },
      );
    }
    const authUserId =
      typeof current.auth_user_id === "string" ? current.auth_user_id : null;

    if (hardDelete) {
      if (authUserId) {
        return NextResponse.json(
          {
            success: false,
            code: "AUTH_HARD_DELETE_UNAVAILABLE",
            error: "La eliminación definitiva de una cuenta enlazada requiere el proceso administrativo de baja. Desactívala por ahora.",
          },
          { status: 409 },
        );
      }
      const { error } = await supabase.from("usuarios").delete().eq("id", id);
      if (error) return NextResponse.json({ success: false, error: "Error al eliminar" }, { status: 500 });
    } else {
      const { error } = await supabase
        .from("usuarios")
        .update(toSupabaseColumns({ estado: "INACTIVO" }))
        .eq("id", id);
      if (error) return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
      if (authUserId) {
        try {
          const identityResult = await actualizarIdentidadAdministrada({
            authUserId,
            active: false,
          });
          const identityError = identityMutationError(identityResult);
          if (identityError) {
            await revertirUsuario(id, { estado: current.estado });
            return identityError;
          }
        } catch {
          await revertirUsuario(id, { estado: current.estado });
          return NextResponse.json(
            { success: false, error: "No se pudo desactivar la cuenta" },
            { status: 500 },
          );
        }
      }
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}
