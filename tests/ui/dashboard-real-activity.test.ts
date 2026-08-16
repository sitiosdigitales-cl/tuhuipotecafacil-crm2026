import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("actividad real del dashboard", () => {
  it("renderiza solo el historial persistido", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/componentes/dashboard/ActividadTiempoReal.tsx"
      ),
      "utf8"
    );

    expect(source).toContain("const { actividades } = useActivities()");
    expect(source).toContain("PERSISTIDA");
    expect(source).toContain("router.push(`/clientes/${actividad.leadId}`)");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("setInterval");
    expect(source).not.toContain("generarActividadesDesdeLeads");
    expect(source).not.toContain("VIVO");
  });
});
