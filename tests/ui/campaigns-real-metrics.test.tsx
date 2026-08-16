import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import CampanasPage from "@/app/(dashboard)/campanas/page";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

const campanas = [
  {
    id: "campana-real-1",
    nombre: "Seguimiento agosto",
    tipo: "EMAIL",
    estado: "ACTIVA",
    descripcion: "Seguimiento real",
    fechaInicio: "2026-08-01T00:00:00.000Z",
    fechaFin: "2026-08-31T23:59:59.000Z",
    presupuesto: 1_000_000,
    gastado: 500_000,
    audiencia: 2_000,
    enviados: 2_000,
    abiertos: 1_000,
    clics: 200,
    conversiones: 20,
    ingresos: 4_000_000,
    roi: 150,
    segmento: "Clientes vigentes",
    plantilla: "Seguimiento",
    creador: "Equipo CRM",
    creadoEn: "2026-08-01T12:00:00.000Z",
  },
  {
    id: "campana-real-2",
    nombre: "Recordatorio septiembre",
    tipo: "WHATSAPP",
    estado: "PROGRAMADA",
    descripcion: "Recordatorio real",
    fechaInicio: "2026-09-01T00:00:00.000Z",
    fechaFin: "2026-09-30T23:59:59.000Z",
    presupuesto: 500_000,
    gastado: 0,
    audiencia: 1_000,
    enviados: 1_000,
    abiertos: 500,
    clics: 100,
    conversiones: 10,
    ingresos: 1_000_000,
    roi: 50,
    segmento: "Solicitudes abiertas",
    plantilla: "Recordatorio",
    creador: "Equipo CRM",
    creadoEn: "2026-08-02T12:00:00.000Z",
  },
];

describe("métricas reales de campañas", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("calcula los indicadores desde la respuesta de la API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ success: true, data: campanas }))
    );

    render(<CampanasPage />);

    expect(await screen.findByText("Seguimiento agosto")).toBeTruthy();
    expect(screen.getByText("Recordatorio septiembre")).toBeTruthy();
    expect(screen.getByText("3.000")).toBeTruthy();
    expect(screen.getAllByText("50%").length).toBeGreaterThan(0);
    expect(screen.getAllByText("20%").length).toBeGreaterThan(0);
    expect(screen.getByText("30")).toBeTruthy();
    expect(screen.getByText("100%")).toBeTruthy();
    expect(screen.queryByText("Black Friday Hipotecario 2024")).toBeNull();
    expect(screen.queryByRole("button", { name: /nueva campaña/i })).toBeNull();
  });

  it("distingue un fallo de carga de una lista vacía", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ success: false, error: "No se pudieron cargar las campañas" }, 500)
      )
    );

    render(<CampanasPage />);

    expect(await screen.findByText("No se pudieron cargar las campañas")).toBeTruthy();
    expect(screen.queryByText("No hay campañas para este filtro")).toBeNull();
  });
});
