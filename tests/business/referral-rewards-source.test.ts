import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/app/(dashboard)/referidos/page.tsx"),
  "utf8"
);

describe("beneficios económicos de referidos", () => {
  it("no publica montos ni plazos sin una fuente de negocio", () => {
    expect(source).not.toContain("RECOMPENSAS");
    expect(source).not.toContain("Programa de Recompensas");
    expect(source).not.toContain("Comisión del 0.5%");
    expect(source).not.toContain("máximo 48 horas");
    expect(source).not.toContain("$ 750.000 + Viaje");
  });
});
