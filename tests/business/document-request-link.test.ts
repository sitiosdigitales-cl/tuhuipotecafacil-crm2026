import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { applicationBaseUrl, portalClientUrl } from "@/lib/application-url";

describe("enlace de solicitud de documentos", () => {
  it("envía al portal autenticado sin datos del cliente en la URL", () => {
    const component = readFileSync(
      join(process.cwd(), "src/componentes/documentos/SolicitarDocumentos.tsx"),
      "utf8"
    );
    const email = readFileSync(join(process.cwd(), "src/lib/email.ts"), "utf8");

    expect(component).toContain("/portal-cliente");
    expect(component).not.toContain("/subir-documentos?lead=");
    expect(component).not.toMatch(/token=.*Math\.random/);
    expect(email).not.toContain("/portal-cliente?lead=");
    expect(email).not.toContain('"http://localhost:3000"');
  });

  it("usa el dominio productivo de Vercel cuando no hay URL personalizada", () => {
    const env = {
      NODE_ENV: "production",
      VERCEL_PROJECT_PRODUCTION_URL: "crm.example.com",
    } as NodeJS.ProcessEnv;

    expect(applicationBaseUrl(env)).toBe("https://crm.example.com/");
    expect(portalClientUrl(env)).toBe("https://crm.example.com/portal-cliente");
  });

  it("no reemplaza una configuración productiva ausente por localhost", () => {
    expect(() =>
      applicationBaseUrl({ NODE_ENV: "production" } as NodeJS.ProcessEnv)
    ).toThrow(/URL productiva/);
  });
});
