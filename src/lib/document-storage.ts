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
  return EXTENSION_BY_MIME[mimeType.trim().toLowerCase()] ?? null;
}

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return (
    bytes.length >= signature.length &&
    signature.every((byte, index) => bytes[index] === byte)
  );
}

function decodeZipEntryName(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function docxEntryNames(bytes: Uint8Array): string[] | null {
  if (!startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) || bytes.length < 22) {
    return null;
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const earliestEndRecord = Math.max(0, bytes.length - 22 - 0xffff);
  let endRecordOffset = -1;

  for (let offset = bytes.length - 22; offset >= earliestEndRecord; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      const commentLength = view.getUint16(offset + 20, true);
      if (offset + 22 + commentLength === bytes.length) {
        endRecordOffset = offset;
        break;
      }
    }
  }

  if (endRecordOffset < 0) return null;
  if (
    view.getUint16(endRecordOffset + 4, true) !== 0 ||
    view.getUint16(endRecordOffset + 6, true) !== 0
  ) {
    return null;
  }

  const entriesOnDisk = view.getUint16(endRecordOffset + 8, true);
  const totalEntries = view.getUint16(endRecordOffset + 10, true);
  const directorySize = view.getUint32(endRecordOffset + 12, true);
  const directoryOffset = view.getUint32(endRecordOffset + 16, true);

  if (
    entriesOnDisk !== totalEntries ||
    totalEntries === 0 ||
    totalEntries > 2_048 ||
    directoryOffset + directorySize > endRecordOffset
  ) {
    return null;
  }

  const names: string[] = [];
  let offset = directoryOffset;
  let totalUncompressedSize = 0;

  for (let entry = 0; entry < totalEntries; entry += 1) {
    if (offset + 46 > endRecordOffset || view.getUint32(offset, true) !== 0x02014b50) {
      return null;
    }

    const flags = view.getUint16(offset + 8, true);
    const compressionMethod = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const entryEnd = offset + 46 + nameLength + extraLength + commentLength;

    if (
      flags & 0x1 ||
      ![0, 8].includes(compressionMethod) ||
      compressedSize === 0xffffffff ||
      uncompressedSize === 0xffffffff ||
      entryEnd > endRecordOffset ||
      localHeaderOffset + 30 > directoryOffset ||
      view.getUint32(localHeaderOffset, true) !== 0x04034b50
    ) {
      return null;
    }

    const name = decodeZipEntryName(bytes.subarray(offset + 46, offset + 46 + nameLength));
    const localNameLength = view.getUint16(localHeaderOffset + 26, true);
    const localName = decodeZipEntryName(
      bytes.subarray(localHeaderOffset + 30, localHeaderOffset + 30 + localNameLength)
    );
    if (
      !name ||
      name !== localName ||
      name.startsWith("/") ||
      name.includes("\\") ||
      name.split("/").some((segment) => segment === "." || segment === "..") ||
      /[\u0000-\u001f\u007f]/.test(name)
    ) {
      return null;
    }

    totalUncompressedSize += uncompressedSize;
    if (totalUncompressedSize > 100 * 1024 * 1024) return null;
    names.push(name);
    offset = entryEnd;
  }

  return offset === directoryOffset + directorySize ? names : null;
}

export async function documentContentMatchesMimeType(file: File): Promise<boolean> {
  const mimeType = file.type.trim().toLowerCase();
  const prefix = new Uint8Array(await file.slice(0, 16).arrayBuffer());

  switch (mimeType) {
    case "application/pdf":
      return startsWith(prefix, [0x25, 0x50, 0x44, 0x46, 0x2d]);
    case "image/jpeg":
    case "image/jpg":
      return startsWith(prefix, [0xff, 0xd8, 0xff]);
    case "image/png":
      return startsWith(prefix, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "application/msword":
      return startsWith(prefix, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      const names = docxEntryNames(new Uint8Array(await file.arrayBuffer()));
      return Boolean(
        names?.includes("[Content_Types].xml") &&
          names.includes("_rels/.rels") &&
          names.includes("word/document.xml") &&
          !names.some((name) => name.toLowerCase().endsWith("/vbaproject.bin"))
      );
    }
    default:
      return false;
  }
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
