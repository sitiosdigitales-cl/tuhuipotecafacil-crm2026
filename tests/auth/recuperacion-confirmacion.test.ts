import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  actualizarIdentidadAdministrada,
  createRequestAuthClient,
  from,
  getUser,
  rpc,
  revocarSesionesSupabase,
} = vi.hoisted(() => ({
  actualizarIdentidadAdministrada: vi.fn(),
  createRequestAuthClient: vi.fn(),
  from: vi.fn(),
  getUser: vi.fn(),
  rpc: vi.fn(),
  revocarSesionesSupabase: vi.fn(),
}));

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({ from, rpc }),
}));
vi.mock("@/lib/supabase-auth", () => ({
  createRequestAuthClient,
  revocarSesionesSupabase,
}));
vi.mock("@/lib/supabase-auth-accounts", () => ({
  actualizarIdentidadAdministrada,
}));

import { POST } from "@/app/api/auth/recuperacion/confirmacion/route";
import { RECUPERACION_VENTANA_SEGUNDOS } from "@/lib/recuperacion-password";

const AUTH_USER_ID = "10000000-0000-4000-8000-000000000001";
const PENDING_AUTH_USER_ID = "10000000-0000-4000-8000-000000000002";
const PASSWORD_VALIDA = "Sintetica-2026-Clave!";
const CUENTA = {
  id: "usuario-sintetico",
  nombre: "Cuenta",
  email: "recuperacion@example.invalid",
  estado: "ACTIVO",
  auth_user_id: AUTH_USER_ID,
};
const CUENTA_PENDIENTE = {
  ...CUENTA,
  auth_user_id: null,
  auth_pending_user_id: PENDING_AUTH_USER_ID,
};

/** Access token sintético: solo importa el `iat`, que es lo que se lee. */
function tokenEmitidoHace(segundos: number) {
  const emitido = Math.floor(Date.now() / 1_000) - segundos;
  const payload = Buffer.from(JSON.stringify({ iat: emitido })).toString(
    "base64url",
  );
  return `encabezado.${payload}.firma`;
}

function queryResult(result: unknown) {
  const query = new Proxy<Record<string, unknown>>(
    {},
    {
      get: (_target, property) => {
        if (property === "then") {
          return (
            onFulfilled?: (value: unknown) => unknown,
            onRejected?: (reason: unknown) => unknown,
          ) => Promise.resolve(result).then(onFulfilled, onRejected);
        }
        return vi.fn(() => query);
      },
    },
  );
  return query;
}

function confirmacion({
  token = tokenEmitidoHace(30),
  password = PASSWORD_VALIDA,
  conCookie = true,
}: { token?: string; password?: string; conCookie?: boolean } = {}) {
  const request = new NextRequest(
    "http://localhost/api/auth/recuperacion/confirmacion",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    },
  );
  if (conCookie) request.cookies.set("crm_rec_access", token);
  return request;
}

beforeEach(() => {
  actualizarIdentidadAdministrada.mockReset();
  createRequestAuthClient.mockReset();
  from.mockReset();
  getUser.mockReset();
  rpc.mockReset();
  revocarSesionesSupabase.mockReset();

  createRequestAuthClient.mockReturnValue({ auth: { getUser } });
  getUser.mockResolvedValue({
    data: {
      user: {
        id: AUTH_USER_ID,
        email: CUENTA.email,
        app_metadata: { crm_user_id: CUENTA.id },
      },
    },
    error: null,
  });
  from.mockReturnValue(queryResult({ data: CUENTA, error: null }));
  rpc.mockResolvedValue({ data: true, error: null });
  actualizarIdentidadAdministrada.mockResolvedValue({ status: "ok" });
  revocarSesionesSupabase.mockResolvedValue(undefined);
});

describe("confirmación de la contraseña recuperada", () => {
  it("cambia la contraseña, revoca todo y borra las cookies", async () => {
    const response = await POST(confirmacion());
    const cuerpo = await response.json();
    const cookies = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(cuerpo.success).toBe(true);
    expect(actualizarIdentidadAdministrada).toHaveBeenCalledWith({
      authUserId: AUTH_USER_ID,
      password: PASSWORD_VALIDA,
    });
    expect(revocarSesionesSupabase).toHaveBeenCalledTimes(1);
    expect(cookies).toContain("crm_rec_access=;");
    expect(cookies).toContain("crm_sb_access=;");
    expect(cookies).toContain("crm_token=;");
  });

  it("rechaza el enlace pasada la ventana de recuperación", async () => {
    const response = await POST(
      confirmacion({ token: tokenEmitidoHace(RECUPERACION_VENTANA_SEGUNDOS + 60) }),
    );
    const cuerpo = await response.json();

    expect(response.status).toBe(401);
    expect(cuerpo.code).toBe("RECUPERACION_NO_VIGENTE");
    expect(getUser).not.toHaveBeenCalled();
    expect(actualizarIdentidadAdministrada).not.toHaveBeenCalled();
  });

  it("no acepta la petición sin la cookie del canje", async () => {
    const response = await POST(confirmacion({ conCookie: false }));
    const cuerpo = await response.json();

    expect(response.status).toBe(401);
    expect(cuerpo.code).toBe("RECUPERACION_NO_VIGENTE");
    expect(actualizarIdentidadAdministrada).not.toHaveBeenCalled();
  });

  it("no acepta una cookie de sesión normal en lugar del canje", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { status: 401 } });

    const response = await POST(confirmacion());

    expect(response.status).toBe(401);
    expect(actualizarIdentidadAdministrada).not.toHaveBeenCalled();
  });

  it("no cambia la contraseña de una identidad que no es la de la cuenta", async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          id: AUTH_USER_ID,
          email: CUENTA.email,
          app_metadata: { crm_user_id: "otro-usuario" },
        },
      },
      error: null,
    });

    const response = await POST(confirmacion());

    expect(response.status).toBe(401);
    expect(actualizarIdentidadAdministrada).not.toHaveBeenCalled();
  });

  it("no recupera una cuenta inhabilitada", async () => {
    from.mockReturnValue(
      queryResult({ data: { ...CUENTA, estado: "INACTIVO" }, error: null }),
    );

    const response = await POST(confirmacion());

    expect(response.status).toBe(401);
    expect(actualizarIdentidadAdministrada).not.toHaveBeenCalled();
  });

  it("aplica la política de contraseñas antes de tocar Supabase Auth", async () => {
    const response = await POST(confirmacion({ password: "corta1!A" }));
    const cuerpo = await response.json();

    expect(response.status).toBe(400);
    expect(cuerpo.error).toContain("al menos");
    expect(getUser).not.toHaveBeenCalled();
    expect(actualizarIdentidadAdministrada).not.toHaveBeenCalled();
  });

  it("deja reintentar cuando Supabase Auth rechaza la contraseña", async () => {
    actualizarIdentidadAdministrada.mockResolvedValue({ status: "weak_password" });

    const response = await POST(confirmacion());

    expect(response.status).toBe(400);
    expect(revocarSesionesSupabase).not.toHaveBeenCalled();
  });

  it("confirma el cambio aunque la revocación falle", async () => {
    revocarSesionesSupabase.mockRejectedValue(new Error("sesión ya invalidada"));

    const response = await POST(confirmacion());

    expect(response.status).toBe(200);
  });

  it("enlaza una identidad pendiente solo después de cambiar la contraseña", async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          id: PENDING_AUTH_USER_ID,
          email: CUENTA_PENDIENTE.email,
          app_metadata: { crm_pending_user_id: CUENTA_PENDIENTE.id },
        },
      },
      error: null,
    });
    from
      .mockReturnValueOnce(
        queryResult({ data: null, error: { code: "PGRST116" } }),
      )
      .mockReturnValueOnce(
        queryResult({ data: CUENTA_PENDIENTE, error: null }),
      );

    const response = await POST(confirmacion());

    expect(response.status).toBe(200);
    expect(actualizarIdentidadAdministrada).toHaveBeenCalledWith(
      expect.objectContaining({
        authUserId: PENDING_AUTH_USER_ID,
        password: PASSWORD_VALIDA,
      }),
    );
    expect(actualizarIdentidadAdministrada).toHaveBeenNthCalledWith(2, {
      authUserId: PENDING_AUTH_USER_ID,
      appMetadata: {
        crm_user_id: CUENTA_PENDIENTE.id,
        crm_pending_user_id: null,
      },
    });
    expect(rpc).toHaveBeenCalledWith("enlazar_identidad_recuperada", {
      p_usuario_id: CUENTA_PENDIENTE.id,
      p_auth_user_id: PENDING_AUTH_USER_ID,
    });
    expect(actualizarIdentidadAdministrada.mock.invocationCallOrder[0]).toBeLessThan(
      rpc.mock.invocationCallOrder[0],
    );
    expect(revocarSesionesSupabase).toHaveBeenCalledTimes(1);
  });

  it("no acepta una identidad pendiente que declara otra cuenta", async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          id: PENDING_AUTH_USER_ID,
          email: CUENTA_PENDIENTE.email,
          app_metadata: { crm_pending_user_id: "otra-cuenta" },
        },
      },
      error: null,
    });
    from
      .mockReturnValueOnce(
        queryResult({ data: null, error: { code: "PGRST116" } }),
      )
      .mockReturnValueOnce(
        queryResult({ data: CUENTA_PENDIENTE, error: null }),
      );

    const response = await POST(confirmacion());

    expect(response.status).toBe(401);
    expect(actualizarIdentidadAdministrada).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("reanuda el enlace si los metadatos ya fueron promovidos", async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          id: PENDING_AUTH_USER_ID,
          email: CUENTA_PENDIENTE.email,
          app_metadata: { crm_user_id: CUENTA_PENDIENTE.id },
        },
      },
      error: null,
    });
    from
      .mockReturnValueOnce(
        queryResult({ data: null, error: { code: "PGRST116" } }),
      )
      .mockReturnValueOnce(
        queryResult({ data: CUENTA_PENDIENTE, error: null }),
      );

    const response = await POST(confirmacion());

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("enlazar_identidad_recuperada", {
      p_usuario_id: CUENTA_PENDIENTE.id,
      p_auth_user_id: PENDING_AUTH_USER_ID,
    });
  });

  it("no declara éxito si el enlace atómico de la cuenta falla", async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          id: PENDING_AUTH_USER_ID,
          email: CUENTA_PENDIENTE.email,
          app_metadata: { crm_pending_user_id: CUENTA_PENDIENTE.id },
        },
      },
      error: null,
    });
    from
      .mockReturnValueOnce(
        queryResult({ data: null, error: { code: "PGRST116" } }),
      )
      .mockReturnValueOnce(
        queryResult({ data: CUENTA_PENDIENTE, error: null }),
      );
    rpc.mockResolvedValueOnce({ data: null, error: { code: "P0001" } });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await POST(confirmacion());

    expect(response.status).toBe(500);
    expect(revocarSesionesSupabase).not.toHaveBeenCalled();
  });

  it("completa el enlace al reintentar después de una promoción parcial", async () => {
    getUser
      .mockResolvedValueOnce({
        data: {
          user: {
            id: PENDING_AUTH_USER_ID,
            email: CUENTA_PENDIENTE.email,
            app_metadata: { crm_pending_user_id: CUENTA_PENDIENTE.id },
          },
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          user: {
            id: PENDING_AUTH_USER_ID,
            email: CUENTA_PENDIENTE.email,
            app_metadata: { crm_user_id: CUENTA_PENDIENTE.id },
          },
        },
        error: null,
      });
    from
      .mockReturnValueOnce(
        queryResult({ data: null, error: { code: "PGRST116" } }),
      )
      .mockReturnValueOnce(
        queryResult({ data: CUENTA_PENDIENTE, error: null }),
      )
      .mockReturnValueOnce(
        queryResult({ data: null, error: { code: "PGRST116" } }),
      )
      .mockReturnValueOnce(
        queryResult({ data: CUENTA_PENDIENTE, error: null }),
      );
    rpc
      .mockResolvedValueOnce({ data: null, error: { code: "P0001" } })
      .mockResolvedValueOnce({ data: true, error: null });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const firstResponse = await POST(confirmacion());
    const retryResponse = await POST(confirmacion());

    expect(firstResponse.status).toBe(500);
    expect(retryResponse.status).toBe(200);
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenLastCalledWith("enlazar_identidad_recuperada", {
      p_usuario_id: CUENTA_PENDIENTE.id,
      p_auth_user_id: PENDING_AUTH_USER_ID,
    });
  });
});
