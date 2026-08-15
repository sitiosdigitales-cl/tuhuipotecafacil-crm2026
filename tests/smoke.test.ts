import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("test runner", () => {
  it("resolves TypeScript aliases and application helpers", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
