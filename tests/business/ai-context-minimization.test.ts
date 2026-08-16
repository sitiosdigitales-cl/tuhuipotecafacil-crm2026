import { describe, expect, it } from "vitest";

import { generarResumenLeads } from "@/lib/ai/estadisticas";
import type { Lead } from "@/tipos";

describe("minimización de datos enviados al asistente", () => {
  it("resume el caso sin identificadores directos del cliente", () => {
    const lead: Lead = {
      apellido: "Contreras",
      creadoEn: new Date("2026-08-15T12:00:00.000Z"),
      diasEnEtapa: 4,
      email: "persona.real@example.invalid",
      enDicom: false,
      etapa: "EVALUACION_BANCARIA",
      id: "lead-privado",
      montoSolicitado: 120_000_000,
      nombre: "Camila",
      origen: "WEB",
      prioridad: "MEDIA",
      rut: "12.345.678-5",
      situacionLaboral: "DEPENDIENTE",
      telefono: "+56 9 1111 2222",
    };

    const summary = generarResumenLeads([lead]);

    expect(summary).not.toContain(lead.nombre);
    expect(summary).not.toContain(lead.apellido);
    expect(summary).not.toContain(lead.rut);
    expect(summary).not.toContain(lead.email);
    expect(summary).not.toContain(lead.telefono);
    expect(summary).toContain("EVALUACION BANCARIA");
    expect(summary).toContain("$120M CLP");
  });
});
