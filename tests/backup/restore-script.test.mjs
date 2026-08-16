import { execFile } from "node:child_process";
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { afterEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const temporaryDirectories = [];

async function executable(path, contents) {
  await writeFile(path, contents);
  await chmod(path, 0o700);
}

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), "crm-restore-script-"));
  temporaryDirectories.push(directory);
  const binDirectory = join(directory, "bin");
  const stateDirectory = join(directory, "state");
  await mkdir(binDirectory);
  await mkdir(stateDirectory);

  await executable(
    join(binDirectory, "restic"),
    `#!/usr/bin/env bash
set -euo pipefail
target=""
while [[ $# -gt 0 ]]; do
  if [[ "$1" == "--target" ]]; then
    target="$2"
    shift 2
  else
    shift
  fi
done
mkdir -p "$target/snapshot/database" "$target/snapshot/storage/objects"
printf 'roles' > "$target/snapshot/database/roles.sql"
printf 'schema' > "$target/snapshot/database/schema.sql"
printf 'data' > "$target/snapshot/database/data.sql"
checksum='0000000000000000000000000000000000000000000000000000000000000000'
printf '%s  roles.sql\\n%s  schema.sql\\n%s  data.sql\\n' \
  "$checksum" "$checksum" "$checksum" \
  > "$target/snapshot/database/checksums.sha256"
printf '{}' > "$target/snapshot/database/metadata.json"
printf '{}' > "$target/snapshot/storage/storage-manifest.json"
`,
  );
  await executable(
    join(binDirectory, "psql"),
    `#!/usr/bin/env bash
set -euo pipefail
query=""
data_file_seen=false
while [[ $# -gt 0 ]]; do
  case "$1" in
    --command)
      query="$2"
      shift 2
      ;;
    --file)
      if [[ "$2" == */data.sql ]]; then data_file_seen=true; fi
      shift 2
      ;;
    *) shift ;;
  esac
done
if [[ "$data_file_seen" == true ]]; then touch "$MOCK_STATE/restored"; fi
if [[ "$query" == *"storage.objects"* ]]; then
  printf '2\\n'
elif [[ "$query" == *"pg_tables"* ]]; then
  if [[ -f "$MOCK_STATE/restored" ]]; then
    printf '27\\n'
  else
    printf '%s\\n' "\${MOCK_PUBLIC_TABLES_BEFORE:-0}"
  fi
fi
`,
  );
  await executable(
    join(binDirectory, "node"),
    "#!/usr/bin/env bash\nprintf '{\"success\":true}\n'\n",
  );
  await executable(
    join(binDirectory, "sha256sum"),
    "#!/usr/bin/env bash\nexit 0\n",
  );

  return { directory, binDirectory, stateDirectory };
}

async function runRestore({ publicTablesBefore = "0" } = {}) {
  const { directory, binDirectory, stateDirectory } = await fixture();
  const reportFile = join(directory, "report.json");
  const environment = {
    ...process.env,
    PATH: `${binDirectory}:${process.env.PATH}`,
    MOCK_STATE: stateDirectory,
    MOCK_PUBLIC_TABLES_BEFORE: publicTablesBefore,
    TARGET_ENVIRONMENT: "staging",
    CONFIRM_RESTORE: "RESTORE_EMPTY_STAGING",
    TARGET_SUPABASE_DB_URL: "postgresql://synthetic.invalid/database",
    TARGET_SUPABASE_URL: "https://synthetic.invalid",
    TARGET_SUPABASE_SERVICE_ROLE_KEY: "synthetic-service-role",
    RESTIC_REPOSITORY: "s3:https://synthetic.invalid/backups",
    RESTIC_PASSWORD: "synthetic-restic-password",
    RESTORE_REPORT_FILE: reportFile,
  };

  return {
    directory,
    reportFile,
    stateDirectory,
    execution: execFileAsync(
      "bash",
      ["scripts/backup/restore-external-backup.sh"],
      { cwd: process.cwd(), env: environment },
    ),
  };
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("orquestador de restauración", () => {
  it("restaura un snapshot y genera un reporte sin datos de clientes", async () => {
    const run = await runRestore();
    await expect(run.execution).resolves.toEqual(
      expect.objectContaining({ stdout: expect.stringContaining('"success":true') }),
    );

    const report = JSON.parse(await readFile(run.reportFile, "utf8"));
    expect(report).toEqual({
      success: true,
      durationSeconds: expect.any(Number),
      publicTables: 27,
      storageObjects: 2,
    });
  });

  it("se detiene antes del restore si public no está vacío", async () => {
    const run = await runRestore({ publicTablesBefore: "1" });
    await expect(run.execution).rejects.toMatchObject({ code: 1 });
    await expect(readFile(join(run.stateDirectory, "restored"))).rejects.toThrow();
  });
});
