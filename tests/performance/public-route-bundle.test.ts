import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROUTE = "simulador-publico";
const ROUTE_ENTRY = `[project]/src/app/${ROUTE}/page`;
const BUNDLE_BUDGET_BYTES = 400 * 1024;
const NEXT_DIRECTORY = join(process.cwd(), ".next");
const ROUTE_DIRECTORY = join(NEXT_DIRECTORY, "server", "app", ROUTE, "page");
const BUILD_MANIFEST = join(ROUTE_DIRECTORY, "build-manifest.json");
const LOADABLE_MANIFEST = join(ROUTE_DIRECTORY, "react-loadable-manifest.json");
const CLIENT_REFERENCE_MANIFEST = join(
  NEXT_DIRECTORY,
  "server",
  "app",
  ROUTE,
  "page_client-reference-manifest.js"
);

interface BuildManifest {
  rootMainFiles?: string[];
}

interface LoadableManifestEntry {
  files?: string[];
}

interface ClientReferenceManifest {
  entryJSFiles?: Record<string, string[]>;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function readClientReferenceManifest(): ClientReferenceManifest {
  const source = readFileSync(CLIENT_REFERENCE_MANIFEST, "utf8");
  const assignment = `globalThis.__RSC_MANIFEST["/${ROUTE}/page"] = `;
  const assignmentIndex = source.indexOf(assignment);

  if (assignmentIndex === -1) {
    throw new Error(`No se encontró el manifiesto cliente de /${ROUTE}`);
  }

  const json = source
    .slice(assignmentIndex + assignment.length)
    .trim()
    .replace(/;$/, "");

  return JSON.parse(json) as ClientReferenceManifest;
}

const buildArtifactsAvailable = [
  BUILD_MANIFEST,
  LOADABLE_MANIFEST,
  CLIENT_REFERENCE_MANIFEST,
].every(existsSync);

describe.skipIf(!buildArtifactsAvailable)("presupuesto de JavaScript público", () => {
  it("mantiene /simulador-publico dentro de 400 KiB", () => {
    const buildManifest = readJson<BuildManifest>(BUILD_MANIFEST);
    const loadableManifest = readJson<Record<string, LoadableManifestEntry>>(
      LOADABLE_MANIFEST
    );
    const clientReferenceManifest = readClientReferenceManifest();
    const initialFiles = [
      ...(buildManifest.rootMainFiles ?? []),
      ...(clientReferenceManifest.entryJSFiles?.[ROUTE_ENTRY] ?? []),
    ];
    const dynamicFiles = Object.values(loadableManifest).flatMap(
      ({ files = [] }) => files.filter((file) => file.endsWith(".js"))
    );
    const routeFiles = [...new Set([...initialFiles, ...dynamicFiles])];
    const routeBytes = routeFiles.reduce(
      (total, file) => total + statSync(join(NEXT_DIRECTORY, file)).size,
      0
    );

    expect(routeBytes).toBeLessThanOrEqual(BUNDLE_BUDGET_BYTES);
  });
});
