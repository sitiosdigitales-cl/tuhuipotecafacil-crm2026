#!/usr/bin/env node

import { createHmac, randomUUID } from "node:crypto";

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

const admin = createAuthClient(serviceRoleKey);
const pendingSession = createAuthClient(anonKey);
const recoveryExchange = createAuthClient(anonKey);
const repeatedExchange = createAuthClient(anonKey);
const credentialCheck = createAuthClient(anonKey);
const refreshCheck = createAuthClient(anonKey);

const runId = randomUUID();
const recoveryTurnId = randomUUID();
const pendingTurnId = randomUUID();
const crmUserId = `recovery-${runId}`;
const email = `recovery-${runId}@example.invalid`;
const pendingPassword = "Synthetic-pending-password-2026!";
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
  const inserted = await admin.from("usuarios").insert({
    id: crmUserId,
    nombre: "Cuenta",
    apellido: "Sintetica",
    email,
    password: "synthetic-legacy-hash",
    rol: "SUPER_ADMIN",
    estado: "ACTIVO",
  });
  assertNoError(inserted.error, "crear cuenta CRM legada sintética");
  insertedCrmUser = true;

  const claimed = await admin.rpc("reclamar_recuperacion_password", {
    p_usuario_id: crmUserId,
    p_espera_segundos: 900,
    p_turno: recoveryTurnId,
  });
  assertNoError(claimed.error, "reservar el correo de recuperación legado");
  if (claimed.data !== true) {
    throw new Error("La cuenta legada no obtuvo el turno de recuperación");
  }

  const pendingClaim = await admin.rpc("reservar_identidad_pendiente", {
    p_usuario_id: crmUserId,
    p_turno: pendingTurnId,
    p_ventana_segundos: 900,
  });
  assertNoError(pendingClaim.error, "reservar identidad pendiente");
  if (pendingClaim.data !== true) {
    throw new Error("La cuenta legada no obtuvo la reserva de identidad");
  }

  const created = await admin.auth.admin.createUser({
    email,
    password: pendingPassword,
    email_confirm: true,
    app_metadata: { crm_pending_user_id: crmUserId },
  });
  assertNoError(created.error, "crear identidad pendiente sintética");
  if (!created.data.user) {
    throw new Error("Auth no devolvió la identidad pendiente sintética");
  }
  authUserId = created.data.user.id;

  const registered = await admin.rpc("registrar_identidad_pendiente", {
    p_usuario_id: crmUserId,
    p_turno: pendingTurnId,
    p_auth_user_id: authUserId,
  });
  assertNoError(registered.error, "registrar identidad pendiente");
  if (registered.data !== true) {
    throw new Error("La identidad pendiente no quedó registrada");
  }

  const pendingState = await admin
    .from("usuarios")
    .select(
      "auth_user_id,auth_pending_user_id,auth_pending_desde,auth_pending_turno,password,tiene_password",
    )
    .eq("id", crmUserId)
    .single();
  assertNoError(pendingState.error, "verificar estado pendiente");
  if (
    pendingState.data?.auth_user_id !== null ||
    pendingState.data?.auth_pending_user_id !== authUserId ||
    !pendingState.data?.auth_pending_desde ||
    pendingState.data?.auth_pending_turno !== pendingTurnId ||
    pendingState.data?.password === null ||
    pendingState.data?.tiene_password !== true
  ) {
    throw new Error("La cuenta no conservó el estado pendiente recuperable");
  }

  const signedInPending = await pendingSession.auth.signInWithPassword({
    email,
    password: pendingPassword,
  });
  assertNoError(signedInPending.error, "emitir sesión previa al enlace");
  if (!signedInPending.data.session) {
    throw new Error("Auth no devolvió la sesión previa al enlace");
  }
  if (
    signedInPending.data.user?.app_metadata?.crm_pending_user_id !== crmUserId ||
    signedInPending.data.user?.app_metadata?.crm_user_id
  ) {
    throw new Error("La identidad pendiente recibió metadatos de cuenta enlazada");
  }

  const crmSessionLookup = await admin
    .from("usuarios")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  assertNoError(crmSessionLookup.error, "comprobar aislamiento de la identidad pendiente");
  if (crmSessionLookup.data) {
    throw new Error("La identidad pendiente ya resolvía una sesión CRM");
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
    throw new Error("El canje no devolvió la identidad pendiente esperada");
  }

  const repeated = await repeatedExchange.auth.verifyOtp({
    type: "recovery",
    token_hash: tokenHash,
  });
  assertRejectedSession(repeated, "el token se pudo canjear dos veces");

  const enrolled = await recoveryExchange.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Recuperación CI",
    issuer: "TuHipotecaFacil.cl",
  });
  assertNoError(enrolled.error, "enrolar TOTP sintético de recuperación");
  if (!enrolled.data || enrolled.data.type !== "totp") {
    throw new Error("Auth no devolvió el TOTP sintético de recuperación");
  }

  const verifiedMfa = await recoveryExchange.auth.mfa.challengeAndVerify({
    factorId: enrolled.data.id,
    code: currentTotp(enrolled.data.totp.secret),
  });
  assertNoError(verifiedMfa.error, "activar TOTP sintético de recuperación");
  if (!verifiedMfa.data) {
    throw new Error("Auth no devolvió la sesión AAL2 de recuperación");
  }

  const updated = await admin.auth.admin.updateUserById(authUserId, {
    password: nextPassword,
  });
  assertNoError(updated.error, "cambiar contraseña de la identidad pendiente");

  const promoted = await admin.auth.admin.updateUserById(authUserId, {
    app_metadata: { crm_user_id: crmUserId },
  });
  assertNoError(promoted.error, "promover metadatos de la identidad recuperada");

  const linked = await admin.rpc("enlazar_identidad_recuperada", {
    p_usuario_id: crmUserId,
    p_auth_user_id: authUserId,
  });
  assertNoError(linked.error, "enlazar identidad recuperada");
  if (linked.data !== true) {
    throw new Error("La identidad recuperada no quedó enlazada");
  }

  const linkedState = await admin
    .from("usuarios")
    .select(
      "auth_user_id,auth_migrated_at,auth_pending_user_id,auth_pending_desde,auth_pending_turno,password,tiene_password",
    )
    .eq("id", crmUserId)
    .single();
  assertNoError(linkedState.error, "verificar cuenta recuperada enlazada");
  if (
    linkedState.data?.auth_user_id !== authUserId ||
    !linkedState.data?.auth_migrated_at ||
    linkedState.data?.auth_pending_user_id !== null ||
    linkedState.data?.auth_pending_desde !== null ||
    linkedState.data?.auth_pending_turno !== null ||
    linkedState.data?.password !== null ||
    linkedState.data?.tiene_password !== false
  ) {
    throw new Error("La cuenta recuperada no terminó en el estado enlazado");
  }

  const signedOut = await admin.auth.admin.signOut(
    verifiedMfa.data.access_token,
    "global",
  );
  if (signedOut.error) {
    const previousRefreshProbe = await refreshCheck.auth.refreshSession({
      refresh_token: signedInPending.data.session.refresh_token,
    });
    const recoveryRefreshProbe = await refreshCheck.auth.refreshSession({
      refresh_token: verifiedMfa.data.refresh_token,
    });
    if (!previousRefreshProbe.error || !recoveryRefreshProbe.error) {
      assertNoError(signedOut.error, "revocar sesiones en alcance global");
    }
  }

  const refreshedPrevious = await refreshCheck.auth.refreshSession({
    refresh_token: signedInPending.data.session.refresh_token,
  });
  assertRejectedSession(
    refreshedPrevious,
    "el refresh pendiente siguió vigente después del cambio",
  );

  const refreshedRecovery = await refreshCheck.auth.refreshSession({
    refresh_token: verifiedMfa.data.refresh_token,
  });
  assertRejectedSession(
    refreshedRecovery,
    "el refresh de recuperación siguió vigente después del cierre global",
  );

  const previousCredential = await credentialCheck.auth.signInWithPassword({
    email,
    password: pendingPassword,
  });
  assertRejectedSession(
    previousCredential,
    "la contraseña previa siguió iniciando sesión",
  );

  const nextCredential = await credentialCheck.auth.signInWithPassword({
    email,
    password: nextPassword,
  });
  assertNoError(nextCredential.error, "iniciar sesión con la contraseña nueva");
  if (!nextCredential.data.session || nextCredential.data.user?.id !== authUserId) {
    throw new Error("La contraseña nueva no devolvió la identidad esperada");
  }

  const assurance = await credentialCheck.auth.mfa.getAuthenticatorAssuranceLevel(
    nextCredential.data.session.access_token,
  );
  assertNoError(assurance.error, "comprobar MFA después de recuperar");
  if (
    assurance.data?.currentLevel !== "aal1" ||
    assurance.data?.nextLevel !== "aal2"
  ) {
    throw new Error("El siguiente login administrativo no exigió TOTP");
  }

  console.log("Legacy recovery integration: OK");
} finally {
  if (insertedCrmUser) {
    await admin.from("usuarios").delete().eq("id", crmUserId);
  }
  if (authUserId) {
    await admin.auth.admin.deleteUser(authUserId);
  }
}
