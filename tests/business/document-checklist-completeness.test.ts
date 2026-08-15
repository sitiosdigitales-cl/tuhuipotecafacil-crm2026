import { describe, expect, it } from "vitest";

import {
  DOCUMENTOS_PATRIMONIO,
  buscarDocSubido,
  obtenerDocumentosCompletos,
  obtenerDocumentosPorSituacion,
} from "@/modulos/documentos/config";
import type { DocConfigEntry } from "@/modulos/documentos/config";

type DocumentoSubido = { nombre: string; tipo: string };

function documentoPara(config: DocConfigEntry): DocumentoSubido {
  return { nombre: config.nombre, tipo: config.tipo };
}

function checklistCompleto(
  situacionLaboral: string,
  documentos: DocumentoSubido[]
): boolean {
  return obtenerDocumentosCompletos(situacionLaboral)
    .filter((config) => config.obligatorio)
    .every((config) =>
      documentos.some((documento) => buscarDocSubido(documento, config))
    );
}

describe("completitud del checklist documental", () => {
  it.each([
    ["DEPENDIENTE", 6],
    ["INDEPENDIENTE", 9],
    ["EMPRESA", 12],
  ])("%s define %i requisitos", (situacionLaboral, totalEsperado) => {
    const requisitos = obtenerDocumentosPorSituacion(situacionLaboral);

    expect(requisitos).toHaveLength(totalEsperado);
    expect(requisitos.every((config) => config.obligatorio)).toBe(true);
  });

  it.each(["DEPENDIENTE", "INDEPENDIENTE", "EMPRESA"])(
    "considera completo a %s sin exigir documentos opcionales de patrimonio",
    (situacionLaboral) => {
      const documentos = obtenerDocumentosPorSituacion(situacionLaboral).map(
        documentoPara
      );

      expect(DOCUMENTOS_PATRIMONIO.every((config) => !config.obligatorio)).toBe(
        true
      );
      expect(checklistCompleto(situacionLaboral, documentos)).toBe(true);
    }
  );

  it.each([
    ["INDEPENDIENTE", "resumen-anual-2025"],
    ["EMPRESA", "balance-2024"],
    ["EMPRESA", "renta-f22-2025"],
    ["EMPRESA", "aceptacion-renta-2025"],
  ])(
    "no considera completo a %s si falta %s aunque exista otra versión anual",
    (situacionLaboral, requisitoAusente) => {
      const documentos = obtenerDocumentosPorSituacion(situacionLaboral)
        .filter((config) => config.id !== requisitoAusente)
        .map(documentoPara);

      expect(checklistCompleto(situacionLaboral, documentos)).toBe(false);
    }
  );
});
