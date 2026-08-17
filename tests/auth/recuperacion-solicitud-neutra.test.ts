import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const {
  createUser,
  deleteUser,
  enviarEmailRecuperacion,
  from,
  generateLink,
  getUserById,
  listUsers,
  rpc,
  updateUserById,
} = vi.hoisted(() => ({
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  enviarEmailRecuperacion: vi.fn(),
  from: vi.fn(),
  generateLink: vi.fn(),
  getUserById: vi.fn(),
  listUsers: vi.fn(),
  rpc: vi.fn(),
  updateUserById: vi.fn(),
}));

vi.mock("@/lib/email", () => ({ enviarEmailRecuperacion }));
vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({
    auth: {
      admin: {
        createUser,
        deleteUser,
        generateLink,
        getUserById,
        listUsers,
        updateUserById,
      },
    },
    from,
    rpc,
  }),
}));

import { POST } from "@/app/api/auth/recuperacion/route";
import { MENSAJE_NEUTRO_RECUPERACION } from "@/lib/recuperacion-password";

const originalAppUrl = process.env.APP_URL;
const originalAuthMode = process.env.SUPABASE_AUTH_MODE;
const PENDING_AUTH_USER_ID = "10000000-0000-4000-8000-000000000002";
const PENDING_AUTH_USER = {
  id: PENDING_AUTH_USER_ID,
  email: "recuperacion@example.invalid",
  app_metadata: { crm_pending_user_id: "usuario-sintetico" },
};
const CUENTA = {
  id: "usuario-sintetico",
  nombre: "Cuenta",
  email: "recuperacion@example.invalid",
  estado: "ACTIVO",
  auth_user_id: "10000000-0000-4000-8000-000000000001",
  auth_pending_user_id: null,
  tiene_password: false,
};

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

function solicitud(email = CUENTA.email) {
  return new NextRequest("http://localhost/api/auth/recuperacion", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

function cuentaEncontrada(cuenta: unknown) {
  from.mockReturnValueOnce(queryResult({ data: cuenta, error: null }));
}

function cuentaAusente() {
  from.mockReturnValueOnce(
    queryResult({ data: null, error: { code: "PGRST116" } }),
  );
}

beforeEach(() => {
  process.env.APP_URL = "https://crm.example.invalid";
  process.env.SUPABASE_AUTH_MODE = "required";
  createUser.mockReset();
  deleteUser.mockReset();
  from.mockReset();
  generateLink.mockReset();
  getUserById.mockReset();
  listUsers.mockReset();
  rpc.mockReset();
  updateUserById.mockReset();
  enviarEmailRecuperacion.mockReset();
  createUser.mockResolvedValue({ data: { user: PENDING_AUTH_USER }, error: null });
  deleteUser.mockResolvedValue({ data: null, error: null });
  enviarEmailRecuperacion.mockResolvedValue(true);
  getUserById.mockResolvedValue({
    data: { user: PENDING_AUTH_USER },
    error: null,
  });
  listUsers.mockResolvedValue({
    data: { users: [PENDING_AUTH_USER] },
    error: null,
  });
  rpc.mockImplementation(async (functionName: string) => ({
    data:
      functionName === "liberar_identidad_pendiente"
        ? PENDING_AUTH_USER_ID
        : true,
    error: null,
  }));
  updateUserById.mockResolvedValue({
    data: { user: PENDING_AUTH_USER },
    error: null,
  });
  generateLink.mockResolvedValue({
    data: { properties: { hashed_token: "token-sintetico" } },
    error: null,
  });
});

afterAll(() => {
  if (originalAppUrl === undefined) delete process.env.APP_URL;
  else process.env.APP_URL = originalAppUrl;
  if (originalAuthMode === undefined) delete process.env.SUPABASE_AUTH_MODE;
  else process.env.SUPABASE_AUTH_MODE = originalAuthMode;
});

describe("solicitud de recuperación", () => {
  it("mantiene el mismo piso temporal con cuenta y sin cuenta", async () => {
    vi.useFakeTimers();

    try {
      cuentaEncontrada(CUENTA);
      enviarEmailRecuperacion.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve(true), 250)),
      );

      const inicioConCuenta = performance.now();
      const respuestaConCuenta = POST(solicitud());
      await vi.runAllTimersAsync();
      await respuestaConCuenta;
      const duracionConCuenta = performance.now() - inicioConCuenta;

      cuentaAusente();
      const inicioSinCuenta = performance.now();
      const respuestaSinCuenta = POST(solicitud("nadie@example.invalid"));
      await vi.runAllTimersAsync();
      await respuestaSinCuenta;
      const duracionSinCuenta = performance.now() - inicioSinCuenta;

      expect(duracionConCuenta).toBeGreaterThanOrEqual(1_000);
      expect(duracionSinCuenta).toBeGreaterThanOrEqual(1_000);
      expect(Math.abs(duracionConCuenta - duracionSinCuenta)).toBeLessThanOrEqual(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("responde lo mismo exista o no la cuenta", async () => {
    cuentaEncontrada(CUENTA);
    const conCuenta = await POST(solicitud());
    const cuerpoConCuenta = await conCuenta.json();

    cuentaAusente();
    const sinCuenta = await POST(solicitud("nadie@example.invalid"));
    const cuerpoSinCuenta = await sinCuenta.json();

    expect(conCuenta.status).toBe(200);
    expect(sinCuenta.status).toBe(200);
    expect(cuerpoSinCuenta).toEqual(cuerpoConCuenta);
    expect(cuerpoConCuenta.mensaje).toBe(MENSAJE_NEUTRO_RECUPERACION);
  });

  it("no envía correo a una cuenta inhabilitada y no lo delata", async () => {
    cuentaEncontrada({ ...CUENTA, estado: "INACTIVO" });

    const response = await POST(solicitud());
    const cuerpo = await response.json();

    expect(response.status).toBe(200);
    expect(cuerpo.mensaje).toBe(MENSAJE_NEUTRO_RECUPERACION);
    expect(generateLink).not.toHaveBeenCalled();
    expect(enviarEmailRecuperacion).not.toHaveBeenCalled();
  });

  it("crea una identidad pendiente para una cuenta legada sin retirar su hash", async () => {
    cuentaEncontrada({
      ...CUENTA,
      auth_user_id: null,
      tiene_password: true,
    });

    const response = await POST(solicitud());
    const cuerpo = await response.json();
    const atributos = createUser.mock.calls[0]?.[0];

    expect(response.status).toBe(200);
    expect(cuerpo.mensaje).toBe(MENSAJE_NEUTRO_RECUPERACION);
    expect(atributos).toEqual(
      expect.objectContaining({
        email: CUENTA.email,
        email_confirm: true,
        app_metadata: { crm_pending_user_id: CUENTA.id },
      }),
    );
    expect(atributos?.app_metadata).not.toHaveProperty("crm_user_id");
    expect(atributos?.password).toEqual(expect.any(String));
    expect(atributos?.password.length).toBeGreaterThanOrEqual(32);
    expect(rpc).toHaveBeenCalledWith(
      "registrar_identidad_pendiente",
      expect.objectContaining({
        p_usuario_id: CUENTA.id,
        p_auth_user_id: PENDING_AUTH_USER_ID,
      }),
    );
    expect(enviarEmailRecuperacion).toHaveBeenCalledTimes(1);
  });

  it("reutiliza la identidad pendiente de la misma cuenta sin crear otra", async () => {
    cuentaEncontrada({
      ...CUENTA,
      auth_user_id: null,
      auth_pending_user_id: PENDING_AUTH_USER_ID,
      tiene_password: true,
    });

    const response = await POST(solicitud());

    expect(response.status).toBe(200);
    expect(createUser).not.toHaveBeenCalled();
    expect(enviarEmailRecuperacion).toHaveBeenCalledTimes(1);
  });

  it("reconcilia por correo una identidad pendiente huérfana de la misma cuenta", async () => {
    cuentaEncontrada({
      ...CUENTA,
      auth_user_id: null,
      tiene_password: true,
    });
    createUser.mockResolvedValueOnce({
      data: { user: null },
      error: { code: "email_exists" },
    });

    const response = await POST(solicitud());

    expect(response.status).toBe(200);
    expect(listUsers).toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith(
      "registrar_identidad_pendiente",
      expect.objectContaining({
        p_usuario_id: CUENTA.id,
        p_auth_user_id: PENDING_AUTH_USER_ID,
      }),
    );
    expect(enviarEmailRecuperacion).toHaveBeenCalledTimes(1);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("mantiene la respuesta neutra si el correo pertenece a otra cuenta", async () => {
    cuentaEncontrada({
      ...CUENTA,
      auth_user_id: null,
      tiene_password: true,
    });
    createUser.mockResolvedValueOnce({
      data: { user: null },
      error: { code: "email_exists" },
    });
    listUsers.mockResolvedValueOnce({
      data: {
        users: [
          {
            ...PENDING_AUTH_USER,
            app_metadata: { crm_pending_user_id: "otra-cuenta" },
          },
        ],
      },
      error: null,
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await POST(solicitud());
    const cuerpo = await response.json();

    expect(response.status).toBe(200);
    expect(cuerpo.mensaje).toBe(MENSAJE_NEUTRO_RECUPERACION);
    expect(enviarEmailRecuperacion).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith(
      "liberar_identidad_pendiente",
      expect.objectContaining({ p_usuario_id: CUENTA.id }),
    );
    expect(rpc).toHaveBeenCalledWith(
      "liberar_recuperacion_password",
      expect.objectContaining({ p_usuario_id: CUENTA.id }),
    );
  });

  it("no crea identidades pendientes mientras el modo siga en legacy", async () => {
    process.env.SUPABASE_AUTH_MODE = "legacy";
    cuentaEncontrada({
      ...CUENTA,
      auth_user_id: null,
      tiene_password: true,
    });

    const response = await POST(solicitud());

    expect(response.status).toBe(200);
    expect(createUser).not.toHaveBeenCalled();
    expect(enviarEmailRecuperacion).not.toHaveBeenCalled();
  });

  it("compensa la identidad creada si Auth no emite el enlace", async () => {
    cuentaEncontrada({
      ...CUENTA,
      auth_user_id: null,
      tiene_password: true,
    });
    generateLink.mockResolvedValueOnce({
      data: null,
      error: { code: "unexpected" },
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await POST(solicitud());

    expect(response.status).toBe(200);
    expect(deleteUser).toHaveBeenCalledWith(PENDING_AUTH_USER_ID);
    expect(rpc).toHaveBeenCalledWith(
      "liberar_identidad_pendiente",
      expect.objectContaining({ p_usuario_id: CUENTA.id }),
    );
    expect(rpc).toHaveBeenCalledWith(
      "liberar_recuperacion_password",
      expect.objectContaining({ p_usuario_id: CUENTA.id }),
    );
    expect(enviarEmailRecuperacion).not.toHaveBeenCalled();
  });

  it("compensa la identidad creada si falla su registro en la cuenta", async () => {
    cuentaEncontrada({
      ...CUENTA,
      auth_user_id: null,
      tiene_password: true,
    });
    rpc.mockImplementation(async (functionName: string) => {
      if (functionName === "registrar_identidad_pendiente") {
        return { data: null, error: { code: "unexpected" } };
      }
      return {
        data:
          functionName === "liberar_identidad_pendiente"
            ? PENDING_AUTH_USER_ID
            : true,
        error: null,
      };
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await POST(solicitud());
    const registro = rpc.mock.calls.find(
      ([functionName]) => functionName === "registrar_identidad_pendiente",
    );

    expect(response.status).toBe(500);
    expect(deleteUser).toHaveBeenCalledWith(PENDING_AUTH_USER_ID);
    expect(rpc).toHaveBeenCalledWith("liberar_identidad_pendiente", {
      p_usuario_id: CUENTA.id,
      p_turno: registro?.[1]?.p_turno,
    });
    expect(rpc).toHaveBeenCalledWith(
      "liberar_recuperacion_password",
      expect.objectContaining({ p_usuario_id: CUENTA.id }),
    );
    expect(generateLink).not.toHaveBeenCalled();
  });

  it("no borra una identidad pendiente preexistente si falla la entrega", async () => {
    cuentaEncontrada({
      ...CUENTA,
      auth_user_id: null,
      auth_pending_user_id: PENDING_AUTH_USER_ID,
      tiene_password: true,
    });
    enviarEmailRecuperacion.mockResolvedValueOnce(false);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await POST(solicitud());

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith(
      "liberar_identidad_pendiente",
      expect.objectContaining({ p_usuario_id: CUENTA.id }),
    );
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("envía el enlace de canje con el token en el fragmento", async () => {
    cuentaEncontrada(CUENTA);

    const response = await POST(solicitud());
    const cuerpo = await response.json();
    const [destinatario, , url] = enviarEmailRecuperacion.mock.calls[0];

    expect(response.status).toBe(200);
    expect(destinatario).toBe(CUENTA.email);
    // El fragmento no viaja al servidor: mantiene el token fuera de los logs
    // de acceso y del Referer.
    expect(url).toBe(
      "https://crm.example.invalid/recuperar-contrasena/canje#token=token-sintetico",
    );
    expect(new URL(url).search).toBe("");
    expect(JSON.stringify(cuerpo)).not.toContain("token-sintetico");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(rpc).toHaveBeenCalledWith(
      "reclamar_recuperacion_password",
      expect.objectContaining({
        p_usuario_id: CUENTA.id,
        p_espera_segundos: 900,
        p_turno: expect.any(String),
      }),
    );
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("libera exactamente su turno cuando el proveedor no acepta el correo", async () => {
    cuentaEncontrada(CUENTA);
    enviarEmailRecuperacion.mockResolvedValueOnce(false);
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await POST(solicitud());
    const cuerpo = await response.json();
    const turno = rpc.mock.calls[0]?.[1]?.p_turno;

    expect(response.status).toBe(200);
    expect(cuerpo.mensaje).toBe(MENSAJE_NEUTRO_RECUPERACION);
    expect(turno).toEqual(expect.any(String));
    expect(rpc).toHaveBeenNthCalledWith(2, "liberar_recuperacion_password", {
      p_usuario_id: CUENTA.id,
      p_turno: turno,
    });
    expect(errorLog).toHaveBeenCalledWith(
      "[recuperacion] El proveedor no aceptó la entrega; turno liberado para reintento",
    );
  });

  it("libera el turno cuando Supabase Auth no emite un token", async () => {
    cuentaEncontrada(CUENTA);
    generateLink.mockResolvedValueOnce({ data: null, error: { code: "unexpected" } });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await POST(solicitud());
    const turno = rpc.mock.calls[0]?.[1]?.p_turno;

    expect(response.status).toBe(200);
    expect(enviarEmailRecuperacion).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenNthCalledWith(2, "liberar_recuperacion_password", {
      p_usuario_id: CUENTA.id,
      p_turno: turno,
    });
  });

  it("calla el segundo intento dentro de la ventana de espera", async () => {
    cuentaEncontrada(CUENTA);
    rpc.mockResolvedValueOnce({ data: false, error: null });

    const response = await POST(solicitud());
    const cuerpo = await response.json();

    expect(response.status).toBe(200);
    expect(cuerpo.mensaje).toBe(MENSAJE_NEUTRO_RECUPERACION);
    expect(generateLink).not.toHaveBeenCalled();
    expect(enviarEmailRecuperacion).not.toHaveBeenCalled();
  });

  it("sigue enviando si la migración del control de frecuencia falta", async () => {
    cuentaEncontrada(CUENTA);
    rpc.mockResolvedValueOnce({ data: null, error: { code: "PGRST202" } });

    const response = await POST(solicitud());

    expect(response.status).toBe(200);
    expect(enviarEmailRecuperacion).toHaveBeenCalledTimes(1);
  });

  it("rechaza un correo mal formado sin consultar la base", async () => {
    const response = await POST(solicitud("no-es-un-correo"));

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });
});
