import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const LEGACY_REGISTER_ROUTE = join(
  process.cwd(),
  "src/app/api/auth/register/route.ts"
);

describe("superficie de alta de usuarios", () => {
  it("mantiene una sola API administrativa para crear cuentas", () => {
    expect(existsSync(LEGACY_REGISTER_ROUTE)).toBe(false);
  });
});
