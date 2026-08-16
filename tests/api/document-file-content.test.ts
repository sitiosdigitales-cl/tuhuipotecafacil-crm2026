import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { from, requireAuth, storageFrom } = vi.hoisted(() => ({
  from: vi.fn(),
  requireAuth: vi.fn(),
  storageFrom: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  forbidden: () => new Response(null, { status: 403 }),
  requireAuth,
  unauthorized: () => new Response(null, { status: 401 }),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from,
    storage: { from: storageFrom },
  },
  toSupabaseColumns: (row: unknown) => row,
}));

vi.mock("@/lib/dispatcher-notificaciones", () => ({
  despacharNotificacion: vi.fn().mockResolvedValue(undefined),
}));

import { POST as portalUpload } from "@/app/api/portal/upload/route";
import { POST as staffUpload } from "@/app/api/upload/route";
import { documentContentMatchesMimeType } from "@/lib/document-storage";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function concatenate(chunks: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(
    chunks.reduce((total, chunk) => total + chunk.length, 0)
  );
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function minimalZip(entryNames: string[]): Uint8Array {
  const encoder = new TextEncoder();
  const localChunks: Uint8Array[] = [];
  const directoryChunks: Uint8Array[] = [];
  let localOffset = 0;

  for (const entryName of entryNames) {
    const name = encoder.encode(entryName);
    const localHeader = new Uint8Array(30);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(26, name.length, true);
    localChunks.push(localHeader, name);

    const directoryHeader = new Uint8Array(46);
    const directoryView = new DataView(directoryHeader.buffer);
    directoryView.setUint32(0, 0x02014b50, true);
    directoryView.setUint16(4, 20, true);
    directoryView.setUint16(6, 20, true);
    directoryView.setUint16(28, name.length, true);
    directoryView.setUint32(42, localOffset, true);
    directoryChunks.push(directoryHeader, name);
    localOffset += localHeader.length + name.length;
  }

  const directory = concatenate(directoryChunks);
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entryNames.length, true);
  endView.setUint16(10, entryNames.length, true);
  endView.setUint32(12, directory.length, true);
  endView.setUint32(16, localOffset, true);
  return concatenate([...localChunks, directory, endRecord]);
}

function uploadRequest(content: BlobPart, mimeType: string, route: string) {
  const formData = new FormData();
  formData.set(
    "archivo",
    new File([content], "documento.pdf", { type: mimeType })
  );
  formData.set("leadId", "lead-uno");
  formData.set("tipo", "LIQUIDACION_SUELDO");
  return {
    formData: vi.fn().mockResolvedValue(formData),
    nextUrl: new URL(`http://localhost${route}`),
  } as unknown as NextRequest;
}

describe("contenido de documentos subidos", () => {
  beforeEach(() => {
    from.mockReset();
    requireAuth.mockReset();
    requireAuth.mockReturnValue({
      email: "admin@example.invalid",
      rol: "ADMIN",
      userId: "admin-uno",
    });
    storageFrom.mockReset();
  });

  it.each([
    ["PDF", "application/pdf"],
    ["JPEG", "image/jpeg"],
    ["PNG", "image/png"],
    ["DOC", "application/msword"],
    [
      "DOCX",
      DOCX_MIME,
    ],
  ])("detecta cuando el contenido no corresponde a %s", async (_label, mimeType) => {
    const file = new File(["contenido de texto"], "documento", { type: mimeType });

    await expect(documentContentMatchesMimeType(file)).resolves.toBe(false);
  });

  it.each([
    ["equipo", staffUpload, "/api/upload"],
    ["portal", portalUpload, "/api/portal/upload"],
  ])(
    "la ruta de %s rechaza contenido distinto antes de tocar datos",
    async (_label, handler, route) => {
      const response = await handler(
        uploadRequest("contenido de texto", "application/pdf", route)
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toMatchObject({ success: false });
      expect(from).not.toHaveBeenCalled();
      expect(storageFrom).not.toHaveBeenCalled();
    }
  );

  it.each([
    ["PDF", new TextEncoder().encode("%PDF-1.7\n")],
    ["JPEG", new Uint8Array([0xff, 0xd8, 0xff, 0xe0])],
    ["PNG", new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
    ["DOC", new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])],
  ])("reconoce una firma válida de %s", async (label, content) => {
    const mimeTypes: Record<string, string> = {
      DOC: "application/msword",
      JPEG: "image/jpeg",
      PDF: "application/pdf",
      PNG: "image/png",
    };
    const file = new File([content], "documento", { type: mimeTypes[label] });

    await expect(documentContentMatchesMimeType(file)).resolves.toBe(true);
  });

  it("reconoce un paquete DOCX mínimo sin contenido activo", async () => {
    const content = minimalZip([
      "[Content_Types].xml",
      "_rels/.rels",
      "word/document.xml",
    ]);
    const file = new File([content.buffer as ArrayBuffer], "documento.docx", {
      type: DOCX_MIME,
    });

    await expect(documentContentMatchesMimeType(file)).resolves.toBe(true);
  });

  it("rechaza un paquete DOCX que declara macros", async () => {
    const content = minimalZip([
      "[Content_Types].xml",
      "_rels/.rels",
      "word/document.xml",
      "word/vbaProject.bin",
    ]);
    const file = new File([content.buffer as ArrayBuffer], "documento.docx", {
      type: DOCX_MIME,
    });

    await expect(documentContentMatchesMimeType(file)).resolves.toBe(false);
  });
});
