import { describe, expect, it } from "vitest";

import {
  REGLAS_POR_ETAPA,
  validarAvance,
} from "@/modulos/leads/validaciones-pipeline";
import type { Etapa, Lead } from "@/tipos";

function leadCompleto(overrides: Partial<Lead> = {}): Lead {
  return {
    apellido: "Prueba",
    banco: "Banco de prueba",
    creadoEn: new Date("2026-01-01T00:00:00.000Z"),
    diasEnEtapa: 0,
    email: "cliente@example.invalid",
    enDicom: false,
    etapa: "NUEVO_LEAD",
    etiquetas: "docs-completos,aprobado-banco",
    id: "lead-reglas",
    montoSolicitado: 80_000_000,
    nombre: "Cliente",
    origen: "WEB",
    prioridad: "MEDIA",
    rut: "11.111.111-1",
    situacionLaboral: "DEPENDIENTE",
    telefono: "+56900000000",
    tipoCredito: "HIPOTECARIO",
    valorPropiedad: 100_000_000,
    ...overrides,
  };
}

describe("reglas de avance del pipeline", () => {
  const etapasConRequisitos = [
    ["CONTACTO_INICIAL", ["contacto-info"]],
    ["CONTACTADO", ["contacto-info"]],
    ["INTERESADO", ["datos-completos", "situacion-laboral"]],
    [
      "CALIFICACION_COMERCIAL",
      ["monto-solicitado", "valor-propiedad", "tipo-credito"],
    ],
    ["DOCS_PENDIENTES", ["banco-asignado"]],
    ["DOCS_COMPLETAS", ["documentos-completos"]],
    ["EVALUACION_BANCARIA", ["monto-validado"]],
    ["APROBADO", ["aprobacion-banco"]],
  ] as const;

  it.each(etapasConRequisitos)(
    "bloquea %s cuando faltan sus requisitos obligatorios",
    (etapaDestino, reglasEsperadas) => {
      const resultado = validarAvance(
        { etapa: "NUEVO_LEAD" } as Lead,
        etapaDestino
      );

      expect(resultado.puedeAvanzar).toBe(false);
      expect(resultado.reglasFallidas.map((regla) => regla.id)).toEqual(
        reglasEsperadas
      );
      expect(resultado.advertencias).toEqual([]);
    }
  );

  it.each(etapasConRequisitos)(
    "permite %s cuando se cumplen todos sus requisitos",
    (etapaDestino) => {
      const resultado = validarAvance(leadCompleto(), etapaDestino);

      expect(resultado.puedeAvanzar).toBe(true);
      expect(resultado.reglasFallidas).toEqual([]);
      expect(resultado.reglasPasadas).toHaveLength(
        REGLAS_POR_ETAPA[etapaDestino].length
      );
    }
  );

  it.each<Etapa>([
    "NUEVO_LEAD",
    "DOCS_PARCIALES",
    "PREAPROBADO",
    "FIRMA_DIGITAL",
    "NOTARIA",
    "CREDITO_PAGADO",
    "CLIENTE_FINALIZADO",
  ])("permite %s porque no tiene requisitos configurados", (etapaDestino) => {
    const resultado = validarAvance(
      { etapa: "NUEVO_LEAD" } as Lead,
      etapaDestino
    );

    expect(resultado).toMatchObject({
      advertencias: [],
      puedeAvanzar: true,
      reglasFallidas: [],
      reglasPasadas: [],
    });
  });
});
