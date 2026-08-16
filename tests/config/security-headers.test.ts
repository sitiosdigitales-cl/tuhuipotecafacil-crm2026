import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";

describe("cabeceras del navegador", () => {
  it("no publica CORS global para todas las APIs", () => {
    const vercel = JSON.parse(
      readFileSync(join(process.cwd(), "vercel.json"), "utf8")
    ) as { headers?: Array<{ source: string }> };

    expect(vercel.headers?.some((rule) => rule.source.includes("/api/")) ?? false).toBe(false);
  });

  it("niega marcos por defecto y limita el único iframe público", async () => {
    const rules = await nextConfig.headers?.();
    const defaultRule = rules?.find((rule) => rule.source.includes("?!formulario-leads"));
    const formRule = rules?.find((rule) => rule.source === "/formulario-leads.html");
    const defaultHeaders = new Map(
      defaultRule?.headers.map((header) => [header.key, header.value])
    );
    const formHeaders = new Map(
      formRule?.headers.map((header) => [header.key, header.value])
    );

    expect(defaultHeaders.get("X-Frame-Options")).toBe("DENY");
    expect(defaultHeaders.get("Content-Security-Policy")).toContain(
      "frame-ancestors 'none'"
    );
    expect(formHeaders.has("X-Frame-Options")).toBe(false);
    expect(formHeaders.get("Content-Security-Policy")).toContain(
      "frame-ancestors 'self' https://tuhipotecafacil.cl https://www.tuhipotecafacil.cl"
    );
    expect(formHeaders.get("Content-Security-Policy")).not.toContain(
      "frame-ancestors *"
    );
  });

  it("envía el cambio de tamaño solo al origen padre esperado", () => {
    const form = readFileSync(
      join(process.cwd(), "public/formulario-leads.html"),
      "utf8"
    );

    expect(form).toContain("PARENT_ORIGIN");
    expect(form).toContain("notifyParent");
    expect(form).not.toMatch(/postMessage\([^;]+,\s*['"]\*['"]\)/);
  });
});
