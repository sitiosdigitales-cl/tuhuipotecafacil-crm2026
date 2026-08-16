import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const routePath = join(
  projectRoot,
  "src/app/api/notificaciones/despachar/route.ts"
);
const dispatcherPath = join(
  projectRoot,
  "src/lib/dispatcher-notificaciones.ts"
);

describe("superficie del dispatcher de notificaciones", () => {
  it("mantiene el despacho como operación interna del servidor", () => {
    expect(existsSync(routePath)).toBe(false);
    expect(readFileSync(dispatcherPath, "utf8")).not.toContain(
      "/api/notificaciones/despachar"
    );
  });
});
