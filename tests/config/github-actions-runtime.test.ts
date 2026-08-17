import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const workflowsDirectory = join(process.cwd(), ".github/workflows");
const workflows = readdirSync(workflowsDirectory)
  .filter((fileName) => /\.ya?ml$/u.test(fileName))
  .map((fileName) => ({
    fileName,
    source: readFileSync(join(workflowsDirectory, fileName), "utf8"),
  }));

describe("runtime de las acciones de GitHub", () => {
  it("usa las versiones con runtime Node 24 en todos los workflows", () => {
    const obsoleteReferences = workflows.flatMap(({ fileName, source }) =>
      [...source.matchAll(/actions\/(?:checkout|setup-node)@(?!v6\b)[^\s]+/gu)].map(
        ([reference]) => `${fileName}: ${reference}`
      )
    );

    expect(obsoleteReferences).toEqual([]);
  });

  it("mantiene Node 22 como runtime de la aplicación", () => {
    const setupBlocks = workflows.flatMap(({ fileName, source }) =>
      [...source.matchAll(/actions\/setup-node@v6[\s\S]*?node-version:\s*([^\s]+)/gu)].map(
        ([, nodeVersion]) => ({ fileName, nodeVersion })
      )
    );

    expect(setupBlocks.length).toBeGreaterThan(0);
    expect(setupBlocks).toEqual(
      setupBlocks.map(({ fileName }) => ({ fileName, nodeVersion: "22" }))
    );
  });
});
