import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/lib/services/googleCalendar.ts"),
  "utf8"
);

describe("persistencia del token de Google Calendar", () => {
  it("no guarda ni recupera el token OAuth desde Web Storage", () => {
    expect(source).not.toMatch(
      /localStorage\.(?:setItem|getItem)\(\s*["']google_access_token["']/
    );
    expect(source).toContain('localStorage.removeItem("google_access_token")');
  });

  it("no registra la respuesta completa del proveedor", () => {
    expect(source).not.toMatch(/console\.error\([^\n]*response/);
  });
});
