import { readFileSync } from "node:fs";
import { join } from "node:path";

import { NextRequest, NextResponse } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { from } = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase", () => ({
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({ from }),
}));

vi.mock("@/lib/api-auth", () => ({
  requireAuth: () => ({
    userId: "usuario-123",
    email: "ejecutiva@example.invalid",
    rol: "EJECUTIVO",
  }),
  unauthorized: () => NextResponse.json({ success: false }, { status: 401 }),
  forbidden: () => NextResponse.json({ success: false }, { status: 403 }),
}));

import { GET as getReferralCode } from "@/app/api/referidos/codigo/route";
import { POST as registerReferral } from "@/app/api/referidos/registrar/route";
import { GET as validateReferral } from "@/app/api/referidos/validar/route";
import { createReferralCode, verifyReferralCode } from "@/lib/referral-code";

const SECRET = "secreto-de-pruebas-con-mas-de-treinta-y-dos-caracteres";
const USUARIO = {
  id: "usuario-123",
  nombre: "Ana",
  apellido: "Pérez",
};

function selectQuery(data = [USUARIO]) {
  const result = { data, error: null };
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    limit: vi.fn(() => query),
    then: (resolve: (value: typeof result) => unknown) =>
      Promise.resolve(result).then(resolve),
  };
  return query;
}

function insertQuery() {
  const query = {
    insert: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn().mockResolvedValue({ data: { id: "lead-uno" }, error: null }),
  };
  return query;
}

describe("códigos de referido", () => {
  let leadInsert = insertQuery();

  beforeEach(() => {
    vi.stubEnv("JWT_SECRET", SECRET);
    from.mockReset();
    leadInsert = insertQuery();
    from.mockImplementation((tabla: string) => {
      if (tabla === "usuarios") return selectQuery();
      if (tabla === "leads") return leadInsert;
      throw new Error(`Tabla inesperada: ${tabla}`);
    });
  });

  afterAll(() => vi.unstubAllEnvs());

  it("genera un código determinista cuya firma corresponde al usuario", () => {
    const codigo = createReferralCode(USUARIO.id);

    expect(createReferralCode(USUARIO.id)).toBe(codigo);
    expect(verifyReferralCode(codigo)).toBe(USUARIO.id);
    expect(verifyReferralCode(`${codigo.slice(0, -1)}A`)).toBeNull();
  });

  it("no considera real un código que solo cumple el patrón antiguo", async () => {
    const response = await validateReferral(
      new NextRequest(
        "http://localhost/api/referidos/validar?codigo=REF-ABC-ABC123"
      )
    );

    await expect(response.json()).resolves.toMatchObject({ valido: false });
    expect(from).not.toHaveBeenCalled();
  });

  it("comprueba que el código firmado pertenece a un usuario activo", async () => {
    const codigo = createReferralCode(USUARIO.id);
    const response = await validateReferral(
      new NextRequest(
        `http://localhost/api/referidos/validar?codigo=${encodeURIComponent(codigo)}`
      )
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ valido: true });
    expect(from).toHaveBeenCalledWith("usuarios");
  });

  it("vuelve a comprobar el código antes de crear el lead", async () => {
    const response = await registerReferral(
      new NextRequest("http://localhost/api/referidos/registrar", {
        body: JSON.stringify({
          codigo: "REF-ABC-ABC123",
          email: "referido@example.invalid",
          nombre: "Caso Referido",
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      })
    );

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalledWith("leads");
  });

  it("registra el propietario comprobado sin devolver la ficha completa", async () => {
    const codigo = createReferralCode(USUARIO.id);
    const response = await registerReferral(
      new NextRequest("http://localhost/api/referidos/registrar", {
        body: JSON.stringify({
          codigo,
          email: "referido@example.invalid",
          nombre: "Caso Referido",
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      })
    );

    expect(response.status).toBe(200);
    expect(leadInsert.insert).toHaveBeenCalledWith(expect.objectContaining({
      codigoReferido: codigo,
      referidoPor: USUARIO.id,
      referidoPorNombre: "Ana Pérez",
    }));
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { id: "lead-uno" },
    });
  });

  it("entrega al panel el código emitido por el servidor", async () => {
    const response = await getReferralCode(
      new NextRequest("http://localhost/api/referidos/codigo")
    );
    const resultado = await response.json() as {
      success: boolean;
      data: { codigo: string };
    };

    expect(response.status).toBe(200);
    expect(resultado.success).toBe(true);
    expect(verifyReferralCode(resultado.data.codigo)).toBe(USUARIO.id);
  });

  it("obtiene el código desde el servidor y no desde aleatoriedad local", () => {
    const page = readFileSync(
      join(process.cwd(), "src/app/(dashboard)/referidos/page.tsx"),
      "utf8"
    );
    const context = readFileSync(
      join(process.cwd(), "src/lib/contexts/LeadContext.tsx"),
      "utf8"
    );

    expect(page).toContain("/api/referidos/codigo");
    expect(context).not.toContain("crm_codigo_ref_");
    expect(context).not.toMatch(/REF-.*Math\.random/);
  });
});
