import { NextRequest, NextResponse } from "next/server";
import { supabase, toSupabaseColumns, limpiarParaFiltro } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { requireAuth, requireRole, unauthorized, forbidden } from "@/lib/api-auth";
import { parseBoundedJson, RequestPayloadError } from "@/lib/request-json";
import { CrearUsuarioSchema } from "@/modulos/usuarios/validaciones";
import { obtenerModoSupabaseAuth } from "@/lib/supabase-auth";
import {
  crearIdentidadAdministrada,
  eliminarIdentidadAdministrada,
} from "@/lib/supabase-auth-accounts";

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

function isUniqueConstraintError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505",
  );
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth) return unauthorized();
  const vistaAdministrativa = ["SUPER_ADMIN", "ADMIN"].includes(auth.rol);
  if (!vistaAdministrativa && !["EJECUTIVO", "AGENTE"].includes(auth.rol)) {
    return forbidden();
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const rol = searchParams.get("rol");
    const estado = searchParams.get("estado");
    const busqueda = searchParams.get("busqueda");

    let query = supabase
      .from("usuarios")
      .select("id,nombre,apellido,email,telefono,rol,estado,cargo,creadoen");

    if (auth.rol === "AGENTE") {
      query = query.eq("id", auth.userId);
    } else if (auth.rol === "EJECUTIVO") {
      query = query.eq("estado", "ACTIVO").neq("rol", "CLIENTE");
    }

    if (id) query = query.eq("id", id);
    if (rol) query = query.eq("rol", rol);
    if (estado) query = query.eq("estado", estado);
    if (busqueda) {
      // Cada palabra se limpia por separado: el texto se interpola en la
      // sintaxis de `.or()`, donde una coma o un paréntesis dejarían de ser
      // parte del valor y pasarían a ser estructura de la consulta.
      const limpio = limpiarParaFiltro(busqueda);
      const palabras = limpio.split(" ").filter(Boolean);
      if (palabras.length) {
        const condiciones = palabras.flatMap((p) => [
          `nombre.ilike.%${p}%`,
          `apellido.ilike.%${p}%`,
        ]);
        query = query.or([...condiciones, `email.ilike.%${limpio}%`].join(","));
      }
    }

    query = query.order("creadoen", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error al consultar usuarios:", error.message, error.details);
      return NextResponse.json({ success: false, error: "No se pudieron cargar los datos" }, { status: 500 });
    }

    const usuarios = (data || []).map((u: Record<string, unknown>) => {
      const usuario: Record<string, unknown> = {
        id: u.id,
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email,
        rol: u.rol,
        estado: u.estado,
        cargo: u.cargo || null,
        ultimoAcceso: null,
        creadoEn: u.creadoen,
      };
      if (vistaAdministrativa) usuario.telefono = u.telefono;
      return usuario;
    });

    return NextResponse.json({ success: true, data: usuarios });
  } catch (e) {
    console.error("Error interno en GET /api/usuarios:", e);
    return NextResponse.json({ success: false, error: "Error al cargar los datos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Solo SUPER_ADMIN. Crear una cuenta es asignar un rol, y ADMIN no
  // administra roles.
  if (!(await requireRole(request, ["SUPER_ADMIN"]))) return forbidden();

  let rawBody: unknown;
  try {
    rawBody = await parseBoundedJson(request, MAX_USUARIO_PAYLOAD_BYTES);
  } catch (error) {
    return invalidPayload(error);
  }

  const parsedBody = CrearUsuarioSchema.safeParse(rawBody);
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
    const { nombre, apellido, email, password, telefono, rol, cargo } = parsedBody.data;
    const authMode = obtenerModoSupabaseAuth();

    const { data: existente, error: lookupError } = await supabase
      .from("usuarios")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (lookupError) {
      return NextResponse.json(
        { success: false, error: "No se pudo validar el correo" },
        { status: 500 },
      );
    }
    if (existente) {
      return NextResponse.json({ success: false, error: "Email ya registrado" }, { status: 409 });
    }

    const id = crypto.randomUUID();
    let authUserId: string | null = null;
    let storedPassword: string | null = null;
    if (authMode === "legacy") {
      storedPassword = await bcrypt.hash(password, 12);
    } else {
      const identity = await crearIdentidadAdministrada({
        crmUserId: id,
        email,
        password,
      });
      if (identity.status === "email_exists") {
        return NextResponse.json(
          { success: false, error: "Email ya registrado" },
          { status: 409 },
        );
      }
      if (identity.status === "weak_password") {
        return NextResponse.json(
          { success: false, error: "La contraseña no cumple la política de acceso" },
          { status: 400 },
        );
      }
      authUserId = identity.user.id;
    }

    const { data: usuario, error } = await supabase
      .from("usuarios")
      .insert(toSupabaseColumns({
        id,
        nombre,
        apellido,
        email,
        password: storedPassword,
        telefono: telefono || null,
        cargo: cargo || null,
        rol,
        estado: "ACTIVO",
        creadoEn: new Date().toISOString(),
        ...(authUserId
          ? {
              auth_user_id: authUserId,
              auth_migrated_at: new Date().toISOString(),
            }
          : {}),
      }))
      .select("id,nombre,apellido,email,rol,estado,creadoen")
      .single();

    if (error) {
      if (authUserId) {
        try {
          await eliminarIdentidadAdministrada(authUserId);
        } catch {}
      }
      if (isUniqueConstraintError(error)) {
        return NextResponse.json(
          { success: false, error: "Email ya registrado" },
          { status: 409 },
        );
      }
      return NextResponse.json({ success: false, error: "Error al crear usuario" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: usuario }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
