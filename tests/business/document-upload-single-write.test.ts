import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function source(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("persistencia única al subir documentos", () => {
  it("deja la creación de registros únicamente en las rutas de upload", () => {
    const collectionRoute = source("src/app/api/documentos/route.ts");
    const uploadRoute = source("src/app/api/upload/route.ts");
    const portalUploadRoute = source("src/app/api/portal/upload/route.ts");

    expect(collectionRoute).not.toMatch(/export async function POST/);
    expect(uploadRoute).toMatch(/from\("documentos"\)\.insert/);
    expect(portalUploadRoute).toMatch(/from\("documentos"\)\.insert/);
  });

  it("actualiza el estado local sin volver a llamar la colección", () => {
    const page = source("src/app/(dashboard)/leads/[id]/page.tsx");
    const handler = page.slice(
      page.indexOf("const handleUploadDoc"),
      page.indexOf("const handleDownloadDoc")
    );

    expect(handler).not.toContain('fetch("/api/documentos"');
    expect(handler).toContain("setDocsSubidos");
  });
});
