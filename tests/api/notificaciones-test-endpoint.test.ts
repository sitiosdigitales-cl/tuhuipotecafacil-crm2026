import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("endpoint interno de prueba de notificaciones", () => {
  it("no se publica como una ruta de producción", () => {
    const routePath = join(
      process.cwd(),
      "src/app/api/notificaciones/test/route.ts"
    );

    expect(existsSync(routePath)).toBe(false);
  });
});
