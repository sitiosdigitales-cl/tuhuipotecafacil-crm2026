import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  STORAGE_MANIFEST_FILE,
  exportStorageBackup,
  parseBucketList,
  restoreStorageBackup,
  verifyStorageBackup,
} from "../../scripts/backup/storage-manifest.mjs";

const temporaryDirectories = [];

function fakeClient(filesByBucket) {
  return {
    storage: {
      from(bucket) {
        const files = filesByBucket[bucket] ?? {};
        return {
          list: vi.fn(async (prefix, { limit, offset }) => {
            const directoryPrefix = prefix ? `${prefix}/` : "";
            const entries = new Map();

            for (const [objectPath, file] of Object.entries(files)) {
              if (!objectPath.startsWith(directoryPrefix)) continue;
              const relativePath = objectPath.slice(directoryPrefix.length);
              const [name, ...remainder] = relativePath.split("/");
              if (remainder.length > 0) {
                entries.set(name, { name, id: null, metadata: null });
              } else {
                entries.set(name, {
                  name,
                  id: `id-${objectPath}`,
                  metadata: { mimetype: file.contentType },
                });
              }
            }

            const page = [...entries.values()]
              .sort((left, right) => left.name.localeCompare(right.name))
              .slice(offset, offset + limit);
            return { data: page, error: null };
          }),
          download: vi.fn(async (objectPath) => {
            const file = files[objectPath];
            return file
              ? { data: new Blob([file.contents]), error: null }
              : { data: null, error: { message: "missing" } };
          }),
        };
      },
    },
  };
}

function fakeWritableClient() {
  const stored = new Map();
  return {
    stored,
    client: {
      storage: {
        from(bucket) {
          return {
            upload: vi.fn(async (objectPath, contents, options) => {
              const identity = `${bucket}\0${objectPath}`;
              if (stored.has(identity) && !options.upsert) {
                return { error: { message: "already exists" } };
              }
              stored.set(identity, Buffer.from(contents));
              return { error: null };
            }),
            download: vi.fn(async (objectPath) => {
              const contents = stored.get(`${bucket}\0${objectPath}`);
              return contents
                ? { data: new Blob([contents]), error: null }
                : { data: null, error: { message: "missing" } };
            }),
          };
        },
      },
    },
  };
}

async function temporaryDirectory() {
  const directory = await mkdtemp(join(tmpdir(), "crm-storage-backup-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("manifiesto del respaldo de Storage", () => {
  it("exporta rutas anidadas sin usarlas como rutas locales", async () => {
    const directory = await temporaryDirectory();
    const client = fakeClient({
      documentos: {
        "lead-sintetico/contrato.pdf": {
          contents: Buffer.from("contenido sintético"),
          contentType: "application/pdf",
        },
      },
      backups: {
        "backup-sintetico.json": {
          contents: Buffer.from("{}"),
          contentType: "application/json",
        },
      },
    });

    const result = await exportStorageBackup({
      client,
      outputDirectory: directory,
      buckets: ["documentos", "backups"],
      now: () => new Date("2026-08-16T00:00:00.000Z"),
    });

    expect(result).toEqual({ buckets: 2, objectCount: 2, totalBytes: 22 });
    await expect(verifyStorageBackup(directory)).resolves.toEqual(result);

    const manifest = JSON.parse(
      await readFile(join(directory, STORAGE_MANIFEST_FILE), "utf8"),
    );
    expect(manifest.objects[0].payload).toMatch(/^[a-f0-9]{64}\.bin$/);
    expect(manifest.objects.map((object) => object.path)).toContain(
      "lead-sintetico/contrato.pdf",
    );
  });

  it("detecta contenido modificado después de exportarlo", async () => {
    const directory = await temporaryDirectory();
    const client = fakeClient({
      documentos: {
        "archivo.pdf": {
          contents: Buffer.from("original"),
          contentType: "application/pdf",
        },
      },
    });

    await exportStorageBackup({
      client,
      outputDirectory: directory,
      buckets: ["documentos"],
    });
    const manifest = JSON.parse(
      await readFile(join(directory, STORAGE_MANIFEST_FILE), "utf8"),
    );
    await writeFile(
      join(directory, "objects", manifest.objects[0].payload),
      "modificado",
    );

    await expect(verifyStorageBackup(directory)).rejects.toThrow("integridad");
  });

  it("restaura cada objeto y confirma el hash descargándolo", async () => {
    const directory = await temporaryDirectory();
    const source = fakeClient({
      documentos: {
        "lead-sintetico/archivo.pdf": {
          contents: Buffer.from("contenido restaurable"),
          contentType: "application/pdf",
        },
      },
    });
    await exportStorageBackup({
      client: source,
      outputDirectory: directory,
      buckets: ["documentos"],
    });
    const target = fakeWritableClient();

    await expect(
      restoreStorageBackup({
        client: target.client,
        inputDirectory: directory,
        upsert: true,
      }),
    ).resolves.toEqual({ buckets: 1, objectCount: 1, totalBytes: 21 });
    expect(
      target.stored.get("documentos\0lead-sintetico/archivo.pdf"),
    ).toEqual(Buffer.from("contenido restaurable"));
  });

  it("rechaza identificadores de bucket con forma de ruta", () => {
    expect(() => parseBucketList("documentos,../otro")).toThrow("inválido");
  });
});
