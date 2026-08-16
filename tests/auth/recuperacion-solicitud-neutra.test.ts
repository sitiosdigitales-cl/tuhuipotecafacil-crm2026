import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { enviarEmailRecuperacion, from, generateLink, rpc } = vi.hoisted(() => ({
  enviarEmailRecuperacion: vi.fn(),
  from: vi.fn(),
  generateLink: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/email", () => ({ enviarEmailRecuperacion }));
vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({ auth: { admin: { generateLink } }, from, rpc }),
}));

import { POST } from "@/app/api/auth/recuperacion/route";
import { MENSAJE_NEUTRO_RECUPERACION } from "@/lib/recuperacion-password";

const originalAppUrl = process.env.APP_URL;
const CUENTA = {
  id: "usuario-sintetico",
  nombre: "Cuenta",
  email: "recuperacion@example.invalid",
  estado: "ACTIVO",
  auth_user_id: "10000000-0000-4000-8000-000000000001",
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
  from.mockReset();
  generateLink.mockReset();
  rpc.mockReset();
  enviarEmailRecuperacion.mockReset();
  enviarEmailRecuperacion.mockResolvedValue(true);
  rpc.mockResolvedValue({ data: true, error: null });
  generateLink.mockResolvedValue({
    data: { properties: { hashed_token: "token-sintetico" } },
    error: null,
  });
});

afterAll(() => {
  if (originalAppUrl === undefined) delete process.env.APP_URL;
  else process.env.APP_URL = originalAppUrl;
});

describe("solicitud de recuperación", () => {
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

  it.each([
    ["inhabilitada", { ...CUENTA, estado: "INACTIVO" }],
    ["sin identidad en Auth", { ...CUENTA, auth_user_id: null }],
  ])("no envía correo a una cuenta %s y no lo delata", async (_caso, cuenta) => {
    cuentaEncontrada(cuenta);

    const response = await POST(solicitud());
    const cuerpo = await response.json();

    expect(response.status).toBe(200);
    expect(cuerpo.mensaje).toBe(MENSAJE_NEUTRO_RECUPERACION);
    expect(generateLink).not.toHaveBeenCalled();
    expect(enviarEmailRecuperacion).not.toHaveBeenCalled();
  });

  it("envía el enlace al callback y no devuelve el token", async () => {
    cuentaEncontrada(CUENTA);

    const response = await POST(solicitud());
    const cuerpo = await response.json();
    const [destinatario, , url] = enviarEmailRecuperacion.mock.calls[0];

    expect(response.status).toBe(200);
    expect(destinatario).toBe(CUENTA.email);
    expect(url).toBe(
      "https://crm.example.invalid/api/auth/recuperacion/callback?token=token-sintetico",
    );
    expect(JSON.stringify(cuerpo)).not.toContain("token-sintetico");
    expect(response.headers.get("cache-control")).toContain("no-store");
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
