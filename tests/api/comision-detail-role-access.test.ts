import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { generarToken } from "@/lib/jwt";
import type { Rol } from "@/tipos";

const { from } = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: { from },
  toSupabaseColumns: (row: unknown) => row,
}));

import { DELETE, PUT } from "@/app/api/comisiones/[id]/route";

const TEST_SECRET = "commission-detail-role-test-secret";
const originalSecret = process.env.JWT_SECRET;
const ROLES_SIN_EDICION: Rol[] = ["EJECUTIVO", "AGENTE", "CLIENTE"];
const ROLES_SIN_ELIMINACION: Rol[] = [
  "ADMIN",
  "EJECUTIVO",
  "AGENTE",
  "CLIENTE",
];

function tableQuery() {
  const query = new Proxy<Record<string, unknown>>(
    {},
    {
      get: (_target, property) => {
        if (property === "then") {
          return (resolve: (value: unknown) => void) =>
            resolve({ error: null });
        }
        return vi.fn(() => query);
      },
    }
  );
  return query;
}

function requestWithRole(method: "PUT" | "DELETE", role: Rol) {
  const token = generarToken({
    email: `${role.toLowerCase()}@example.invalid`,
    rol: role,
    userId: `usuario-${role.toLowerCase()}`,
  });

  return new NextRequest("http://localhost/api/comisiones/comision-uno", {
    body: method === "PUT" ? JSON.stringify({ pagado: true }) : undefined,
    headers: {
      cookie: `crm_token=${token}`,
      "content-type": "application/json",
    },
    method,
  });
}

const params = { params: Promise.resolve({ id: "comision-uno" }) };

describe("matriz de roles de una comisión", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
    from.mockReset();
    from.mockReturnValue(tableQuery());
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it.each(ROLES_SIN_EDICION)(
    "responde 403 al editar con rol %s",
    async (role) => {
      const response = await PUT(requestWithRole("PUT", role), params);

      expect(response.status).toBe(403);
      expect(from).not.toHaveBeenCalled();
    }
  );

  it("permite editar a ADMIN", async () => {
    const response = await PUT(requestWithRole("PUT", "ADMIN"), params);

    expect(response.status).toBe(200);
    expect(from).toHaveBeenCalledWith("comisiones");
  });

  it.each(ROLES_SIN_ELIMINACION)(
    "responde 403 al eliminar con rol %s",
    async (role) => {
      const response = await DELETE(requestWithRole("DELETE", role), params);

      expect(response.status).toBe(403);
      expect(from).not.toHaveBeenCalled();
    }
  );

  it("permite eliminar a SUPER_ADMIN", async () => {
    const response = await DELETE(
      requestWithRole("DELETE", "SUPER_ADMIN"),
      params
    );

    expect(response.status).toBe(200);
    expect(from).toHaveBeenCalledWith("comisiones");
  });
});
