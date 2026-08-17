#!/usr/bin/env node

import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const crmBaseUrl = process.env.CRM_HTTP_BASE_URL;
const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!crmBaseUrl || !supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error("Falta la configuración local del ensayo HTTP de recuperación");
}

const crmUrl = new URL(crmBaseUrl);
const parsedSupabaseUrl = new URL(supabaseUrl);
const localHosts = new Set(["localhost", "127.0.0.1"]);
if (
  process.env.RECOVERY_HTTP_INTEGRATION_TARGET !== "local" ||
  !localHosts.has(crmUrl.hostname) ||
  !localHosts.has(parsedSupabaseUrl.hostname)
) {
  throw new Error("El ensayo HTTP de recuperación solo acepta servicios locales");
}

function createAuthClient(key) {
  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

const admin = createAuthClient(serviceRoleKey);
const pendingClient = createAuthClient(anonKey);
const recoveryClient = createAuthClient(anonKey);
const credentialClient = createAuthClient(anonKey);

const runId = randomUUID();
const crmUserId = `recovery-http-${runId}`;
const email = `recovery-http-${runId}@example.invalid`;
const pendingPassword = "Synthetic-pending-http-password-2026!";
const nextPassword = "Synthetic-recovery-http-password-2027!";
let authUserId = null;
let insertedCrmUser = false;

function assertNoError(error, operation) {
  if (!error) return;

  const code = typeof error.code === "string" ? error.code : "sin_codigo";
  const status = typeof error.status === "number" ? error.status : "sin_estado";
  const message =
    typeof error.message === "string"
      ? error.message.replaceAll(/[\r\n]/g, " ").slice(0, 160)
      : "sin_mensaje";
  throw new Error(
    `Falló el ensayo HTTP de recuperación: ${operation} (${code}, ${status}, ${message})`,
  );
}

async function recoveryRequest() {
  return fetch(new URL("/api/auth/recuperacion", crmUrl), {
    body: JSON.stringify({ email }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

async function usersWithEmail() {
  const matches = [];
  const normalizedEmail = email.toLowerCase();

  for (let page = 1; page <= 100; page += 1) {
    const result = await admin.auth.admin.listUsers({ page, perPage: 1_000 });
    assertNoError(result.error, "listar identidades después de la carrera");
    matches.push(
      ...result.data.users.filter(
        (user) => user.email?.toLowerCase() === normalizedEmail,
      ),
    );
    if (result.data.users.length < 1_000) break;
  }

  return matches;
}

function sessionCookie(session) {
  return [
    `crm_sb_access=${session.access_token}`,
    `crm_sb_refresh=${session.refresh_token}`,
  ].join("; ");
}

async function expectRejectedCrmSession(path, cookie) {
  const response = await fetch(new URL(path, crmUrl), {
    headers: { cookie },
  });
  if (response.status !== 401) {
    throw new Error(`${path} respondió ${response.status} a una identidad pendiente`);
  }
}

try {
  const inserted = await admin.from("usuarios").insert({
    id: crmUserId,
    nombre: "Cuenta",
    apellido: "HTTP",
    email,
    password: "synthetic-legacy-hash",
    rol: "EJECUTIVO",
    estado: "ACTIVO",
  });
  assertNoError(inserted.error, "crear cuenta CRM legada sintética");
  insertedCrmUser = true;

  const recoveryResponses = await Promise.all([
    recoveryRequest(),
    recoveryRequest(),
  ]);
  const recoveryBodies = await Promise.all(
    recoveryResponses.map((response) => response.json()),
  );
  if (recoveryResponses.some((response) => response.status !== 200)) {
    throw new Error("las solicitudes simultáneas no conservaron la respuesta neutra");
  }
  if (JSON.stringify(recoveryBodies[0]) !== JSON.stringify(recoveryBodies[1])) {
    throw new Error("las solicitudes simultáneas devolvieron cuerpos distintos");
  }

  const matchingUsers = await usersWithEmail();
  if (matchingUsers.length !== 1) {
    throw new Error(
      `las solicitudes simultáneas dejaron ${matchingUsers.length} identidades`,
    );
  }
  authUserId = matchingUsers[0].id;

  const pendingState = await admin
    .from("usuarios")
    .select(
      "auth_user_id,auth_pending_user_id,auth_pending_desde,auth_pending_turno,password,tiene_password",
    )
    .eq("id", crmUserId)
    .single();
  assertNoError(pendingState.error, "verificar estado tras solicitudes simultáneas");
  if (
    pendingState.data?.auth_user_id !== null ||
    pendingState.data?.auth_pending_user_id !== authUserId ||
    !pendingState.data?.auth_pending_desde ||
    !pendingState.data?.auth_pending_turno ||
    pendingState.data?.password === null ||
    pendingState.data?.tiene_password !== true
  ) {
    throw new Error("la carrera HTTP no terminó en un único estado pendiente");
  }

  const knownPendingCredential = await admin.auth.admin.updateUserById(
    authUserId,
    { password: pendingPassword },
  );
  assertNoError(
    knownPendingCredential.error,
    "fijar credencial sintética de la identidad pendiente",
  );

  const signedInPending = await pendingClient.auth.signInWithPassword({
    email,
    password: pendingPassword,
  });
  assertNoError(signedInPending.error, "emitir sesión pendiente para HTTP");
  if (!signedInPending.data.session) {
    throw new Error("Auth no devolvió la sesión pendiente para HTTP");
  }

  await expectRejectedCrmSession(
    "/api/auth/me",
    sessionCookie(signedInPending.data.session),
  );
  await expectRejectedCrmSession(
    "/api/leads",
    `crm_sb_access=${signedInPending.data.session.access_token}`,
  );

  const generated = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
  });
  assertNoError(generated.error, "generar token para confirmaciones simultáneas");
  const tokenHash = generated.data?.properties?.hashed_token;
  if (typeof tokenHash !== "string" || !tokenHash) {
    throw new Error("Auth no devolvió el token para confirmaciones simultáneas");
  }

  const verified = await recoveryClient.auth.verifyOtp({
    type: "recovery",
    token_hash: tokenHash,
  });
  assertNoError(verified.error, "canjear token para confirmaciones simultáneas");
  if (!verified.data.session) {
    throw new Error("Auth no devolvió la sesión de confirmación simultánea");
  }

  const confirmation = () =>
    fetch(new URL("/api/auth/recuperacion/confirmacion", crmUrl), {
      body: JSON.stringify({ password: nextPassword }),
      headers: {
        "content-type": "application/json",
        cookie: `crm_rec_access=${verified.data.session.access_token}`,
      },
      method: "POST",
    });

  const confirmationResponses = await Promise.all([
    confirmation(),
    confirmation(),
  ]);
  const confirmationStatuses = confirmationResponses.map(
    (response) => response.status,
  );
  if (
    !confirmationStatuses.includes(200) ||
    confirmationStatuses.some((status) => status !== 200 && status !== 401)
  ) {
    throw new Error(
      `las confirmaciones simultáneas respondieron ${confirmationStatuses.join(",")}`,
    );
  }

  const linkedState = await admin
    .from("usuarios")
    .select(
      "auth_user_id,auth_pending_user_id,auth_pending_desde,auth_pending_turno,password,tiene_password",
    )
    .eq("id", crmUserId)
    .single();
  assertNoError(linkedState.error, "verificar enlace tras confirmaciones simultáneas");
  if (
    linkedState.data?.auth_user_id !== authUserId ||
    linkedState.data?.auth_pending_user_id !== null ||
    linkedState.data?.auth_pending_desde !== null ||
    linkedState.data?.auth_pending_turno !== null ||
    linkedState.data?.password !== null ||
    linkedState.data?.tiene_password !== false
  ) {
    throw new Error("las confirmaciones simultáneas dejaron un estado incoherente");
  }

  const recoveredIdentity = await admin.auth.admin.getUserById(authUserId);
  assertNoError(recoveredIdentity.error, "verificar metadatos después del enlace HTTP");
  if (
    recoveredIdentity.data.user?.app_metadata?.crm_user_id !== crmUserId ||
    recoveredIdentity.data.user?.app_metadata?.crm_pending_user_id
  ) {
    throw new Error("la identidad HTTP no terminó con metadatos enlazados");
  }

  const signedInRecovered = await credentialClient.auth.signInWithPassword({
    email,
    password: nextPassword,
  });
  assertNoError(
    signedInRecovered.error,
    "iniciar sesión con credencial recuperada por HTTP",
  );
  if (signedInRecovered.data.user?.id !== authUserId) {
    throw new Error("la credencial recuperada no devolvió la identidad esperada");
  }

  console.log("Recovery HTTP concurrency integration: OK");
} finally {
  if (insertedCrmUser) {
    const state = await admin
      .from("usuarios")
      .select("auth_user_id")
      .eq("id", crmUserId)
      .maybeSingle();
    if (state.data?.auth_user_id) {
      await admin.from("usuarios").delete().eq("id", crmUserId);
      if (authUserId) await admin.auth.admin.deleteUser(authUserId);
    } else {
      if (authUserId) await admin.auth.admin.deleteUser(authUserId);
      await admin.from("usuarios").delete().eq("id", crmUserId);
    }
  } else if (authUserId) {
    await admin.auth.admin.deleteUser(authUserId);
  }
}
