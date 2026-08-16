import { createHash } from "node:crypto";
import {
  mkdir,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";

export const STORAGE_BACKUP_FORMAT = "tuhuipotecafacil-storage-backup";
export const STORAGE_BACKUP_VERSION = 1;
export const STORAGE_MANIFEST_FILE = "storage-manifest.json";

const DEFAULT_BUCKETS = ["documentos", "backups"];
const OBJECTS_DIRECTORY = "objects";
const PAGE_SIZE = 1_000;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function assertSafeSegment(segment) {
  if (
    typeof segment !== "string" ||
    !segment ||
    segment === "." ||
    segment === ".." ||
    segment.includes("/") ||
    segment.includes("\\") ||
    segment.includes("\0")
  ) {
    throw new Error("Storage devolvió un segmento de ruta inválido");
  }
}

function assertObjectPath(objectPath) {
  if (typeof objectPath !== "string" || !objectPath) {
    throw new Error("El manifiesto contiene una ruta vacía");
  }

  for (const segment of objectPath.split("/")) {
    assertSafeSegment(segment);
  }
}

function payloadName(bucket, objectPath) {
  return `${sha256(`${bucket}\0${objectPath}`)}.bin`;
}

function isFolder(entry) {
  return entry?.id == null && entry?.metadata == null;
}

function objectContentType(entry) {
  const mimeType = entry?.metadata?.mimetype;
  return typeof mimeType === "string" && mimeType.length <= 255
    ? mimeType
    : "application/octet-stream";
}

export function parseBucketList(rawValue) {
  const source = rawValue?.trim() ? rawValue : DEFAULT_BUCKETS.join(",");
  const buckets = [...new Set(source.split(",").map((value) => value.trim()))];

  if (
    buckets.length === 0 ||
    buckets.some((bucket) => !/^[a-z0-9][a-z0-9._-]{0,62}$/.test(bucket))
  ) {
    throw new Error("SUPABASE_BACKUP_BUCKETS contiene un identificador inválido");
  }

  return buckets;
}

async function listObjects(storage, prefix, visited) {
  if (visited.has(prefix)) {
    throw new Error("Storage devolvió una jerarquía cíclica");
  }
  visited.add(prefix);

  const files = [];
  const folders = [];
  let offset = 0;

  while (true) {
    const { data, error } = await storage.list(prefix, {
      limit: PAGE_SIZE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      throw new Error("No se pudo enumerar uno de los buckets del respaldo");
    }

    const entries = data ?? [];
    for (const entry of entries) {
      assertSafeSegment(entry.name);
      const objectPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (isFolder(entry)) {
        folders.push(objectPath);
      } else {
        files.push({ entry, objectPath });
      }
    }

    if (entries.length < PAGE_SIZE) break;
    offset += entries.length;
  }

  for (const folder of folders) {
    files.push(...(await listObjects(storage, folder, visited)));
  }

  return files;
}

export async function exportStorageBackup({
  client,
  outputDirectory,
  buckets = DEFAULT_BUCKETS,
  now = () => new Date(),
}) {
  const normalizedBuckets = parseBucketList(buckets.join(","));
  await mkdir(outputDirectory, { recursive: true });

  const existingFiles = await readdir(outputDirectory);
  if (existingFiles.length > 0) {
    throw new Error("El directorio de respaldo debe estar vacío");
  }

  const objectsDirectory = join(outputDirectory, OBJECTS_DIRECTORY);
  await mkdir(objectsDirectory);

  const manifestObjects = [];
  let totalBytes = 0;

  for (const bucket of normalizedBuckets) {
    const storage = client.storage.from(bucket);
    const objects = await listObjects(storage, "", new Set());

    for (const { entry, objectPath } of objects) {
      const { data, error } = await storage.download(objectPath);
      if (error || !data || typeof data.arrayBuffer !== "function") {
        throw new Error("No se pudo descargar uno de los objetos del respaldo");
      }

      const contents = Buffer.from(await data.arrayBuffer());
      const payload = payloadName(bucket, objectPath);
      await writeFile(join(objectsDirectory, payload), contents, { flag: "wx" });

      manifestObjects.push({
        bucket,
        path: objectPath,
        payload,
        size: contents.byteLength,
        sha256: sha256(contents),
        contentType: objectContentType(entry),
      });
      totalBytes += contents.byteLength;
    }
  }

  manifestObjects.sort((left, right) =>
    `${left.bucket}\0${left.path}`.localeCompare(`${right.bucket}\0${right.path}`),
  );

  const manifest = {
    format: STORAGE_BACKUP_FORMAT,
    version: STORAGE_BACKUP_VERSION,
    createdAt: now().toISOString(),
    buckets: normalizedBuckets,
    objectCount: manifestObjects.length,
    totalBytes,
    objects: manifestObjects,
  };

  await writeFile(
    join(outputDirectory, STORAGE_MANIFEST_FILE),
    `${JSON.stringify(manifest, null, 2)}\n`,
    { flag: "wx" },
  );

  return {
    buckets: normalizedBuckets.length,
    objectCount: manifest.objectCount,
    totalBytes: manifest.totalBytes,
  };
}

function validateManifest(manifest) {
  if (
    !manifest ||
    manifest.format !== STORAGE_BACKUP_FORMAT ||
    manifest.version !== STORAGE_BACKUP_VERSION ||
    !Array.isArray(manifest.buckets) ||
    !Array.isArray(manifest.objects)
  ) {
    throw new Error("Formato de manifiesto no reconocido");
  }

  const buckets = parseBucketList(manifest.buckets.join(","));
  if (buckets.length !== manifest.buckets.length) {
    throw new Error("El manifiesto repite buckets");
  }

  if (
    !Number.isSafeInteger(manifest.objectCount) ||
    manifest.objectCount !== manifest.objects.length ||
    !Number.isSafeInteger(manifest.totalBytes) ||
    manifest.totalBytes < 0
  ) {
    throw new Error("Los totales del manifiesto no son válidos");
  }

  return { ...manifest, buckets };
}

export async function verifyStorageBackup(inputDirectory) {
  const manifestContents = await readFile(
    join(inputDirectory, STORAGE_MANIFEST_FILE),
    "utf8",
  );
  const manifest = validateManifest(JSON.parse(manifestContents));
  const expectedPayloads = new Set();
  const expectedObjects = new Set();
  let totalBytes = 0;

  for (const [index, object] of manifest.objects.entries()) {
    if (
      !object ||
      typeof object.bucket !== "string" ||
      !manifest.buckets.includes(object.bucket) ||
      typeof object.path !== "string" ||
      typeof object.payload !== "string" ||
      typeof object.sha256 !== "string" ||
      typeof object.contentType !== "string" ||
      !object.contentType ||
      object.contentType.length > 255 ||
      !Number.isSafeInteger(object.size) ||
      object.size < 0
    ) {
      throw new Error(`Objeto ${index + 1} inválido en el manifiesto`);
    }

    assertObjectPath(object.path);
    const identity = `${object.bucket}\0${object.path}`;
    if (expectedObjects.has(identity) || expectedPayloads.has(object.payload)) {
      throw new Error(`Objeto ${index + 1} duplicado en el manifiesto`);
    }
    if (object.payload !== payloadName(object.bucket, object.path)) {
      throw new Error(`Payload inválido para el objeto ${index + 1}`);
    }
    if (!/^[a-f0-9]{64}$/.test(object.sha256)) {
      throw new Error(`Hash inválido para el objeto ${index + 1}`);
    }

    const contents = await readFile(
      join(inputDirectory, OBJECTS_DIRECTORY, object.payload),
    );
    if (contents.byteLength !== object.size || sha256(contents) !== object.sha256) {
      throw new Error(`Falló la integridad del objeto ${index + 1}`);
    }

    expectedObjects.add(identity);
    expectedPayloads.add(object.payload);
    totalBytes += contents.byteLength;
  }

  const actualPayloads = await readdir(join(inputDirectory, OBJECTS_DIRECTORY));
  if (
    actualPayloads.length !== expectedPayloads.size ||
    actualPayloads.some((payload) => !expectedPayloads.has(payload)) ||
    totalBytes !== manifest.totalBytes
  ) {
    throw new Error("Los archivos del respaldo no coinciden con el manifiesto");
  }

  return {
    buckets: manifest.buckets.length,
    objectCount: manifest.objectCount,
    totalBytes: manifest.totalBytes,
  };
}

export async function restoreStorageBackup({
  client,
  inputDirectory,
  upsert = false,
}) {
  const verified = await verifyStorageBackup(inputDirectory);
  const manifest = validateManifest(
    JSON.parse(
      await readFile(join(inputDirectory, STORAGE_MANIFEST_FILE), "utf8"),
    ),
  );

  for (const [index, object] of manifest.objects.entries()) {
    const contents = await readFile(
      join(inputDirectory, OBJECTS_DIRECTORY, object.payload),
    );
    const storage = client.storage.from(object.bucket);
    const { error: uploadError } = await storage.upload(object.path, contents, {
      contentType: object.contentType,
      upsert,
    });

    if (uploadError) {
      throw new Error(`No se pudo restaurar el objeto ${index + 1}`);
    }

    const { data, error: downloadError } = await storage.download(object.path);
    if (downloadError || !data || typeof data.arrayBuffer !== "function") {
      throw new Error(`No se pudo verificar el objeto restaurado ${index + 1}`);
    }

    const restoredContents = Buffer.from(await data.arrayBuffer());
    if (
      restoredContents.byteLength !== object.size ||
      sha256(restoredContents) !== object.sha256
    ) {
      throw new Error(`Falló la verificación del objeto restaurado ${index + 1}`);
    }
  }

  return verified;
}
