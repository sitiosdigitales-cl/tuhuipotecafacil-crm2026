#!/usr/bin/env node

import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error("Falta la configuración local del ensayo de recuperación");
}

const parsedUrl = new URL(supabaseUrl);
const localTarget = ["localhost", "127.0.0.1"].includes(parsedUrl.hostname);
const integrationTarget = process.env.RECOVERY_INTEGRATION_TARGET ?? "local";
if (integrationTarget === "local") {
  if (!localTarget) {
    throw new Error("El ensayo local de recuperación no acepta proyectos remotos");
  }
} else if (integrationTarget === "synthetic-staging") {
  if (
    localTarget ||
    parsedUrl.protocol !== "https:" ||
    process.env.RECOVERY_INTEGRATION_CONFIRMATION !==
      "VERIFY_EMPTY_SYNTHETIC_STAGING"
  ) {
    throw new Error("La integración remota requiere staging sintético confirmado");
  }
} else {
  throw new Error("RECOVERY_INTEGRATION_TARGET no es válido");
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
const sessionBeforeChange = createAuthClient(anonKey);
const recoveryExchange = createAuthClient(anonKey);
const repeatedExchange = createAuthClient(anonKey);
const credentialCheck = createAuthClient(anonKey);
const refreshCheck = createAuthClient(anonKey);

const runId = randomUUID();
const recoveryTurnId = randomUUID();
const crmUserId = `recovery-${runId}`;
const email = `recovery-${runId}@example.invalid`;
const previousPassword = "Synthetic-recovery-password-2026!";
const nextPassword = "Synthetic-recovery-password-2027!";
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
    `Falló el ensayo de recuperación: ${operation} (${code}, ${status}, ${message})`,
  );
}

function assertRejectedSession(result, operation) {
  if (!result.error && result.data.session) {
    throw new Error(`Falló el ensayo de recuperación: ${operation}`);
  }
}

try {
  const created = await admin.auth.admin.createUser({
    email,
    password: previousPassword,
    email_confirm: true,
    app_metadata: { crm_user_id: crmUserId },
  });
  assertNoError(created.error, "crear identidad sintética");
  if (!created.data.user) {
    throw new Error("Auth no devolvió la identidad sintética de recuperación");
  }
  authUserId = created.data.user.id;

  const inserted = await admin.from("usuarios").insert({
    id: crmUserId,
    nombre: "Cuenta",
    apellido: "Sintetica",
    email,
    password: null,
    rol: "EJECUTIVO",
    estado: "ACTIVO",
    auth_user_id: authUserId,
  });
  assertNoError(inserted.error, "crear cuenta CRM sintética");
  insertedCrmUser = true;

  const signedInBeforeChange = await sessionBeforeChange.auth.signInWithPassword({
    email,
    password: previousPassword,
  });
  assertNoError(
    signedInBeforeChange.error,
    "emitir sesión anterior al cambio de contraseña",
  );
  if (!signedInBeforeChange.data.session) {
    throw new Error("Auth no devolvió la sesión anterior al cambio");
  }

  const claimed = await admin.rpc("reclamar_recuperacion_password", {
    p_usuario_id: crmUserId,
    p_espera_segundos: 900,
    p_turno: recoveryTurnId,
  });
  assertNoError(claimed.error, "reservar el correo de recuperación");
  if (claimed.data !== true) {
    throw new Error("La primera solicitud no obtuvo el turno de recuperación");
  }

  const generated = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
  });
  assertNoError(generated.error, "generar token de recuperación");
  const tokenHash = generated.data?.properties?.hashed_token;
  if (typeof tokenHash !== "string" || !tokenHash) {
    throw new Error("Auth no devolvió el token de recuperación");
  }

  const verified = await recoveryExchange.auth.verifyOtp({
    type: "recovery",
    token_hash: tokenHash,
  });
  assertNoError(verified.error, "canjear token de recuperación");
  if (!verified.data.session || verified.data.user?.id !== authUserId) {
    throw new Error("El canje no devolvió la sesión de la identidad esperada");
  }

  const repeated = await repeatedExchange.auth.verifyOtp({
    type: "recovery",
    token_hash: tokenHash,
  });
  assertRejectedSession(repeated, "el token se pudo canjear dos veces");

  const updated = await admin.auth.admin.updateUserById(authUserId, {
    password: nextPassword,
  });
  assertNoError(updated.error, "cambiar contraseña con Admin API");

  const signedOut = await admin.auth.admin.signOut(
    verified.data.session.access_token,
    "global",
  );
  if (signedOut.error) {
    const previousRefreshProbe = await refreshCheck.auth.refreshSession({
      refresh_token: signedInBeforeChange.data.session.refresh_token,
    });
    const recoveryRefreshProbe = await refreshCheck.auth.refreshSession({
      refresh_token: verified.data.session.refresh_token,
    });
    if (!previousRefreshProbe.error || !recoveryRefreshProbe.error) {
      assertNoError(signedOut.error, "revocar sesiones en alcance global");
    }
  }

  const refreshedPrevious = await refreshCheck.auth.refreshSession({
    refresh_token: signedInBeforeChange.data.session.refresh_token,
  });
  assertRejectedSession(
    refreshedPrevious,
    "el refresh anterior siguió vigente después del cambio",
  );

  const refreshedRecovery = await refreshCheck.auth.refreshSession({
    refresh_token: verified.data.session.refresh_token,
  });
  assertRejectedSession(
    refreshedRecovery,
    "el refresh de recuperación siguió vigente después del cierre global",
  );

  const previousCredential = await credentialCheck.auth.signInWithPassword({
    email,
    password: previousPassword,
  });
  assertRejectedSession(
    previousCredential,
    "la contraseña anterior siguió iniciando sesión",
  );

  const nextCredential = await credentialCheck.auth.signInWithPassword({
    email,
    password: nextPassword,
  });
  assertNoError(nextCredential.error, "iniciar sesión con la contraseña nueva");
  if (!nextCredential.data.session || nextCredential.data.user?.id !== authUserId) {
    throw new Error("La contraseña nueva no devolvió la identidad esperada");
  }

  console.log("Recovery integration: OK");
} finally {
  if (insertedCrmUser) {
    await admin.from("usuarios").delete().eq("id", crmUserId);
  }
  if (authUserId) {
    await admin.auth.admin.deleteUser(authUserId);
  }
}
