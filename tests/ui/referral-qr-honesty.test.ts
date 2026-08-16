import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/app/(dashboard)/referidos/page.tsx"),
  "utf8"
);

describe("opciones compartibles de referidos", () => {
  it("no presenta ni descarga una imagen que no codifica el enlace", () => {
    expect(source).not.toContain("no es un QR real");
    expect(source).not.toContain("generarQR");
    expect(source).not.toContain("descargarQR");
    expect(source).not.toContain("Descargar QR");
  });
});
