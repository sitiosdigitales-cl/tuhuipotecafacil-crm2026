const DEFAULT_MAX_BYTES = 32 * 1024;

export class RequestPayloadError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 413 | 415
  ) {
    super(message);
    this.name = "RequestPayloadError";
  }
}

async function readBody(request: Request, maxBytes: number): Promise<string> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RequestPayloadError("El cuerpo supera el tamaño permitido", 413);
  }

  if (!request.body) throw new RequestPayloadError("El cuerpo es requerido", 400);

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new RequestPayloadError("El cuerpo supera el tamaño permitido", 413);
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(body);
  } catch {
    throw new RequestPayloadError("El cuerpo no contiene UTF-8 válido", 400);
  }
}

export async function parseBoundedJson(
  request: Request,
  maxBytes = DEFAULT_MAX_BYTES
): Promise<unknown> {
  const contentType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (contentType !== "application/json") {
    throw new RequestPayloadError("Content-Type debe ser application/json", 415);
  }

  const text = await readBody(request, maxBytes);
  try {
    return JSON.parse(text);
  } catch {
    throw new RequestPayloadError("El cuerpo no contiene JSON válido", 400);
  }
}
