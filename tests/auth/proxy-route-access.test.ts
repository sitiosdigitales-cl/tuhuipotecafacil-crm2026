import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { generarToken } from "@/lib/jwt";
import { config, proxy } from "@/proxy";
import type { Rol } from "@/tipos";

const TEST_SECRET = "proxy-test-secret-not-for-production";
const originalSecret = process.env.JWT_SECRET;
const ALL_ROLES: Rol[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "EJECUTIVO",
  "AGENTE",
  "CLIENTE",
];
const PANEL_ROLES: Rol[] = ["SUPER_ADMIN", "ADMIN", "EJECUTIVO"];
const ADMIN_ROLES: Rol[] = ["SUPER_ADMIN", "ADMIN"];
const LEAD_ROLES: Rol[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "EJECUTIVO",
  "AGENTE",
];

const ROUTE_ACCESS: Array<{ path: string; roles: Rol[] }> = [
  { path: "/dashboard", roles: PANEL_ROLES },
  { path: "/pipeline", roles: PANEL_ROLES },
  { path: "/centro-actividad", roles: PANEL_ROLES },
  { path: "/tareas", roles: PANEL_ROLES },
  { path: "/actividades", roles: PANEL_ROLES },
  { path: "/agenda", roles: PANEL_ROLES },
  { path: "/conversaciones", roles: PANEL_ROLES },
  { path: "/reportes", roles: PANEL_ROLES },
  { path: "/bancos", roles: PANEL_ROLES },
  { path: "/cmf", roles: PANEL_ROLES },
  { path: "/simulador", roles: PANEL_ROLES },
  { path: "/referidos", roles: PANEL_ROLES },
  { path: "/campanas", roles: ADMIN_ROLES },
  { path: "/biblioteca", roles: PANEL_ROLES },
  { path: "/flujos", roles: ADMIN_ROLES },
  { path: "/plantillas", roles: ADMIN_ROLES },
  { path: "/triggers", roles: ADMIN_ROLES },
  { path: "/portal", roles: PANEL_ROLES },
  { path: "/recordatorios", roles: PANEL_ROLES },
  { path: "/resumen", roles: PANEL_ROLES },
  { path: "/asistente", roles: PANEL_ROLES },
  { path: "/usuarios", roles: ["SUPER_ADMIN"] },
  { path: "/permisos", roles: ["SUPER_ADMIN"] },
  { path: "/auditoria", roles: ADMIN_ROLES },
  { path: "/backups", roles: ADMIN_ROLES },
  { path: "/configuracion", roles: ADMIN_ROLES },
  { path: "/integraciones", roles: ADMIN_ROLES },
  { path: "/comisiones", roles: ADMIN_ROLES },
  {
    path: "/portal-cliente",
    roles: ["SUPER_ADMIN", "ADMIN", "CLIENTE"],
  },
  { path: "/documentos", roles: LEAD_ROLES },
  { path: "/solicitudes", roles: LEAD_ROLES },
  { path: "/leads", roles: LEAD_ROLES },
  { path: "/clientes", roles: LEAD_ROLES },
];

function requestWithRole(path: string, role: Rol, cookieName = "crm_token") {
  const token = generarToken({
    email: `${role.toLowerCase()}@example.invalid`,
    rol: role,
    userId: `usuario-${role.toLowerCase()}`,
  });

  return new NextRequest(`https://crm.example${path}`, {
    headers: { cookie: `${cookieName}=${token}` },
  });
}

function redirectPath(response: Response) {
  const location = response.headers.get("location");
  return location ? new URL(location).pathname : null;
}

describe("proxy del panel", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = TEST_SECRET;
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it.each(["crm_token", "auth_token"])(
    "rechaza %s cuando la firma no corresponde",
    (cookieName) => {
      process.env.JWT_SECRET = "different-signing-secret-not-for-production";
      const invalidToken = generarToken({
        email: "persona@example.invalid",
        rol: "ADMIN",
        userId: "usuario-prueba",
      });
      process.env.JWT_SECRET = TEST_SECRET;
      const request = new NextRequest("https://crm.example/dashboard", {
        headers: { cookie: `${cookieName}=${invalidToken}` },
      });

      const response = proxy(request);

      expect(response.status).toBe(307);
      expect(redirectPath(response)).toBe("/login");
      expect(response.headers.get("x-middleware-next")).toBeNull();
    }
  );

  it.each(
    ROUTE_ACCESS.flatMap(({ path, roles }) =>
      ALL_ROLES.map((role) => ({ allowed: roles.includes(role), path, role }))
    )
  )(
    "$role en $path respeta la matriz de navegación",
    ({ allowed, path, role }) => {
      const response = proxy(requestWithRole(path, role));

      if (allowed) {
        expect(response.status).toBe(200);
        expect(response.headers.get("x-middleware-next")).toBe("1");
      } else {
        expect(response.status).toBe(307);
        expect(response.headers.get("x-middleware-next")).toBeNull();
      }
    }
  );

  it.each<Rol>(["AGENTE", "CLIENTE"])(
    "no redirige circularmente a %s cuando abre /dashboard",
    (role) => {
      const response = proxy(requestWithRole("/dashboard", role));

      expect(redirectPath(response)).not.toBe("/dashboard");
    }
  );

  it.each(["/login", "/register", "/simulador-publico"])(
    "no ejecuta el proxy para la ruta pública %s",
    (path) => {
      expect(
        unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: path })
      ).toBe(false);
    }
  );

  it("deja continuar /referir/[codigo] sin cookie", () => {
    const path = "/referir/REF-PRUEBA";

    expect(
      unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: path })
    ).toBe(true);

    const response = proxy(new NextRequest(`https://crm.example${path}`));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
