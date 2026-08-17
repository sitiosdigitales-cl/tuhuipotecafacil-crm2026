#!/usr/bin/env node

import { createHmac, randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error("Falta la configuración local del ensayo RLS");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anonymous = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const password = "Synthetic-domain-rls-password-2026!";
const runId = randomUUID();
const identities = [];
const crmUserIds = [];
const domainIds = {
  leads: [`rls-${runId}-lead-a`, `rls-${runId}-lead-b`],
  documentos: [`rls-${runId}-document-a`, `rls-${runId}-document-b`],
  tareas: [`rls-${runId}-task-a`, `rls-${runId}-task-b`],
  comisiones: [`rls-${runId}-commission`],
};
const possibleWriteId = `rls-${runId}-unexpected-write`;

function assertNoError(error, operation) {
  if (!error) return;

  const code = typeof error.code === "string" ? error.code : "sin_codigo";
  const status = typeof error.status === "number" ? error.status : "sin_estado";
  const message =
    typeof error.message === "string"
      ? error.message.replaceAll(/[\r\n]/g, " ").slice(0, 160)
      : "sin_mensaje";
  throw new Error(
    `Falló el ensayo RLS local: ${operation} (${code}, ${status}, ${message})`,
  );
}

function decodeBase32(value) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const normalized = value.toUpperCase().replaceAll(/[^A-Z2-7]/g, "");
  let bits = 0;
  let accumulator = 0;
  const bytes = [];

  for (const character of normalized) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error("El secreto TOTP sintético no es Base32");
    accumulator = (accumulator << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((accumulator >>> bits) & 0xff);
    }
  }

  return Buffer.from(bytes);
}

function currentTotp(secret) {
  const counter = BigInt(Math.floor(Date.now() / 30_000));
  const counterBytes = Buffer.alloc(8);
  counterBytes.writeBigUInt64BE(counter);
  const digest = createHmac("sha1", decodeBase32(secret))
    .update(counterBytes)
    .digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, "0");
}

async function createIdentity(role, options = {}) {
  const crmUserId = `rls-${runId}-${role.toLowerCase()}-${randomUUID()}`;
  const email = `rls-${role.toLowerCase()}-${randomUUID()}@example.invalid`;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { crm_user_id: crmUserId },
  });
  assertNoError(created.error, `crear identidad ${role}`);
  if (!created.data.user) throw new Error(`Auth no devolvió identidad ${role}`);
  identities.push(created.data.user.id);

  if (options.linked !== false) {
    const inserted = await admin.from("usuarios").insert({
      id: crmUserId,
      nombre: "Cuenta",
      apellido: "Sintetica",
      email,
      password: null,
      auth_user_id: created.data.user.id,
      auth_migrated_at: new Date().toISOString(),
      rol: role,
      estado: options.state ?? "ACTIVO",
    });
    assertNoError(inserted.error, `crear cuenta CRM ${role}`);
    crmUserIds.push(crmUserId);
  }

  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const signedIn = await client.auth.signInWithPassword({ email, password });
  assertNoError(signedIn.error, `iniciar sesión ${role}`);
  if (!signedIn.data.session) throw new Error(`Auth no devolvió sesión ${role}`);

  return { client, crmUserId, email };
}

async function elevateToAal2(identity, label) {
  const enrolled = await identity.client.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `RLS ${label}`,
    issuer: "TuHipotecaFacil.cl",
  });
  assertNoError(enrolled.error, `enrolar MFA ${label}`);
  if (!enrolled.data || enrolled.data.type !== "totp") {
    throw new Error(`Auth no devolvió factor TOTP ${label}`);
  }

  const verified = await identity.client.auth.mfa.challengeAndVerify({
    factorId: enrolled.data.id,
    code: currentTotp(enrolled.data.totp.secret),
  });
  assertNoError(verified.error, `verificar MFA ${label}`);
  if (!verified.data) throw new Error(`Auth no devolvió sesión AAL2 ${label}`);
}

async function selectIds(client, table) {
  const { data, error } = await client
    .from(table)
    .select("id")
    .in("id", domainIds[table]);
  assertNoError(error, `consultar ${table}`);
  return (data ?? []).map((row) => row.id).sort();
}

async function expectIds(client, table, expected, label) {
  const actual = await selectIds(client, table);
  const normalizedExpected = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(normalizedExpected)) {
    throw new Error(
      `${label} recibió filas incorrectas en ${table}: ${actual.length}/${normalizedExpected.length}`,
    );
  }
}

async function expectMatrix(identity, expected, label) {
  for (const table of Object.keys(domainIds)) {
    await expectIds(identity.client, table, expected[table], label);
  }
}

async function expectAnonymousWithoutRows(table) {
  const { data } = await anonymous
    .from(table)
    .select("id")
    .in("id", domainIds[table]);
  if ((data ?? []).length > 0) {
    throw new Error(`anon recibió filas en ${table}`);
  }
}

async function expectRecoveryInternalsUnavailable(client, label) {
  const { data, error } = await client
    .from("usuarios")
    .select(
      "tiene_password,auth_pending_user_id,auth_pending_turno,auth_pending_desde",
    )
    .limit(1);

  if (!error || (data ?? []).length > 0) {
    throw new Error(`${label} pudo consultar el estado interno de recuperación`);
  }

  const triggerCall = await client.rpc("limpiar_identidad_pendiente_borrada");
  if (!triggerCall.error) {
    throw new Error(`${label} pudo invocar directamente el disparador de limpieza`);
  }
}

async function expectServerOnlyWrites(client) {
  const insertResult = await client.from("leads").insert({
    id: possibleWriteId,
    nombre: "Escritura",
    apellido: "Inesperada",
    rut: "",
  });
  if (!insertResult.error) throw new Error("authenticated insertó un lead directo");

  const updateResult = await client
    .from("leads")
    .update({ prioridad: "URGENTE" })
    .eq("id", domainIds.leads[0]);
  if (!updateResult.error) throw new Error("authenticated actualizó un lead directo");

  const deleteResult = await client
    .from("leads")
    .delete()
    .eq("id", domainIds.leads[0]);
  if (!deleteResult.error) throw new Error("authenticated eliminó un lead directo");
}

try {
  const superAdmin = await createIdentity("SUPER_ADMIN");
  const administrator = await createIdentity("ADMIN");
  const executive = await createIdentity("EJECUTIVO");
  const agentA = await createIdentity("AGENTE");
  const agentB = await createIdentity("AGENTE");
  const client = await createIdentity("CLIENTE");
  const inactive = await createIdentity("EJECUTIVO", { state: "INACTIVO" });
  const unlinked = await createIdentity("EJECUTIVO", { linked: false });

  await expectRecoveryInternalsUnavailable(anonymous, "anon");
  await expectRecoveryInternalsUnavailable(
    executive.client,
    "authenticated",
  );

  const insertedLeads = await admin.from("leads").insert([
    {
      id: domainIds.leads[0],
      nombre: "Lead",
      apellido: "Sintetico A",
      rut: "",
      email: client.email.toUpperCase(),
      asignadoa: agentA.crmUserId,
    },
    {
      id: domainIds.leads[1],
      nombre: "Lead",
      apellido: "Sintetico B",
      rut: "",
      email: "otro-cliente@example.invalid",
      asignadoa: agentB.crmUserId,
    },
  ]);
  assertNoError(insertedLeads.error, "crear leads sintéticos");

  const insertedDocuments = await admin.from("documentos").insert([
    {
      id: domainIds.documentos[0],
      leadid: domainIds.leads[0],
      nombre: "Documento sintético A",
    },
    {
      id: domainIds.documentos[1],
      leadid: domainIds.leads[1],
      nombre: "Documento sintético B",
    },
  ]);
  assertNoError(insertedDocuments.error, "crear documentos sintéticos");

  const insertedTasks = await admin.from("tareas").insert([
    {
      id: domainIds.tareas[0],
      titulo: "Tarea sintética A",
      asignadoa: agentA.crmUserId,
      leadid: domainIds.leads[0],
    },
    {
      id: domainIds.tareas[1],
      titulo: "Tarea sintética B",
      asignadoa: agentB.crmUserId,
      leadid: domainIds.leads[1],
    },
  ]);
  assertNoError(insertedTasks.error, "crear tareas sintéticas");

  const insertedCommission = await admin.from("comisiones").insert({
    id: domainIds.comisiones[0],
    ejecutivoid: executive.crmUserId,
    ejecutivonombre: "Cuenta Sintética",
    mes: "AGOSTO",
    anio: 2026,
  });
  assertNoError(insertedCommission.error, "crear comisión sintética");

  const emptyMatrix = {
    leads: [],
    documentos: [],
    tareas: [],
    comisiones: [],
  };
  await expectMatrix(superAdmin, emptyMatrix, "SUPER_ADMIN AAL1");
  await expectMatrix(administrator, emptyMatrix, "ADMIN AAL1");

  await elevateToAal2(superAdmin, "SUPER_ADMIN");
  await elevateToAal2(administrator, "ADMIN");

  const fullOperationalMatrix = {
    leads: domainIds.leads,
    documentos: domainIds.documentos,
    tareas: domainIds.tareas,
    comisiones: domainIds.comisiones,
  };
  await expectMatrix(superAdmin, fullOperationalMatrix, "SUPER_ADMIN AAL2");
  await expectMatrix(administrator, fullOperationalMatrix, "ADMIN AAL2");
  await expectMatrix(
    executive,
    {
      ...fullOperationalMatrix,
      comisiones: [],
    },
    "EJECUTIVO",
  );
  await expectMatrix(
    agentA,
    {
      leads: [domainIds.leads[0]],
      documentos: [domainIds.documentos[0]],
      tareas: [domainIds.tareas[0]],
      comisiones: [],
    },
    "AGENTE A",
  );
  await expectMatrix(
    agentB,
    {
      leads: [domainIds.leads[1]],
      documentos: [domainIds.documentos[1]],
      tareas: [domainIds.tareas[1]],
      comisiones: [],
    },
    "AGENTE B",
  );
  await expectMatrix(
    client,
    {
      leads: [domainIds.leads[0]],
      documentos: [domainIds.documentos[0]],
      tareas: [],
      comisiones: [],
    },
    "CLIENTE",
  );
  await expectMatrix(inactive, emptyMatrix, "cuenta inactiva");
  await expectMatrix(unlinked, emptyMatrix, "identidad no enlazada");

  for (const table of Object.keys(domainIds)) {
    await expectAnonymousWithoutRows(table);
    await expectIds(admin, table, domainIds[table], "service_role");
  }

  await expectServerOnlyWrites(superAdmin.client);

  console.log("Domain RLS integration: OK");
} finally {
  await admin.from("documentos").delete().in("id", domainIds.documentos);
  await admin.from("tareas").delete().in("id", domainIds.tareas);
  await admin.from("comisiones").delete().in("id", domainIds.comisiones);
  await admin
    .from("leads")
    .delete()
    .in("id", [...domainIds.leads, possibleWriteId]);
  if (crmUserIds.length > 0) {
    await admin.from("usuarios").delete().in("id", crmUserIds);
  }
  for (const authUserId of identities) {
    await admin.auth.admin.deleteUser(authUserId);
  }
}
