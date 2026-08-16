const PUBLIC_MARKERS = [
  "/storage/v1/object/public/documentos/",
  "/storage/v1/object/sign/documentos/",
  "/storage/v1/object/authenticated/documentos/",
];

const EXTENSION_BY_MIME: Record<string, string> = {
  "application/msword": "doc",
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
};

export function documentExtension(mimeType: string): string | null {
  return EXTENSION_BY_MIME[mimeType] ?? null;
}

export function documentStoragePath(reference: unknown): string | null {
  if (typeof reference !== "string" || !reference.trim()) return null;
  let path = reference.trim();

  if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path);
      const marker = PUBLIC_MARKERS.find((candidate) =>
        url.pathname.includes(candidate)
      );
      if (!marker) return null;
      path = decodeURIComponent(url.pathname.split(marker)[1] ?? "");
    } catch {
      return null;
    }
  } else {
    path = path.split(/[?#]/, 1)[0];
  }

  if (!path || path.length > 512 || path.startsWith("/")) return null;
  const segments = path.split("/");
  if (
    segments.length < 2 ||
    segments.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        /[\\\u0000-\u001f\u007f]/.test(segment)
    )
  ) {
    return null;
  }
  return path;
}

export function documentProxyUrl(
  documentId: unknown,
  storageReference: unknown
): string | null {
  if (typeof documentId !== "string" || !documentStoragePath(storageReference)) {
    return null;
  }
  return `/api/documentos/${encodeURIComponent(documentId)}/archivo`;
}

export function documentWithProxyUrl(
  document: Record<string, unknown>
): Record<string, unknown> {
  const { archivourl, ...normalized } = document;
  const reference = normalized.archivoUrl ?? archivourl;
  return {
    ...normalized,
    archivoUrl: documentProxyUrl(normalized.id, reference),
  };
}
