import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const FORMULARIOS_CLIENTE = [
  "src/app/(dashboard)/clientes/page.tsx",
  "src/app/(dashboard)/clientes/[id]/page.tsx",
];

describe("selección de etiquetas de clientes", () => {
  it.each(FORMULARIOS_CLIENTE)(
    "%s compara cada etiqueta como un valor completo",
    (archivo) => {
      const fuente = readFileSync(join(process.cwd(), archivo), "utf8");
      const coincidencias =
        fuente.match(/\betiqueta\.includes\(tag\.id\)/g) ?? [];

      expect(coincidencias).toEqual([]);
    }
  );
});
