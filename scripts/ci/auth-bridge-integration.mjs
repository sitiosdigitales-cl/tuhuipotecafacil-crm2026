#!/usr/bin/env node

import { createHmac, randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error("Falta la configuración local del ensayo Auth");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const auth = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const crmUserId = randomUUID();
const claimToken = randomUUID();
const email = `auth-bridge-${crmUserId}@example.invalid`;
const password = "Synthetic-auth-bridge-password-2026!";
let authUserId = null;
let insertedCrmUser = false;

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

function assertNoError(error, operation) {
  if (!error) return;

  const code = typeof error.code === "string" ? error.code : "sin_codigo";
  const status = typeof error.status === "number" ? error.status : "sin_estado";
  const message =
    typeof error.message === "string"
      ? error.message.replaceAll(/[\r\n]/g, " ").slice(0, 160)
      : "sin_mensaje";
  throw new Error(
    `Falló el ensayo local: ${operation} (${code}, ${status}, ${message})`,
  );
}

try {
  const inserted = await admin.from("usuarios").insert({
    id: crmUserId,
    nombre: "Cuenta",
    apellido: "Sintetica",
    email,
    password: "synthetic-legacy-hash",
    rol: "EJECUTIVO",
    estado: "ACTIVO",
  });
  assertNoError(inserted.error, "crear cuenta CRM sintética");
  insertedCrmUser = true;

  const claimed = await admin.rpc("reclamar_migracion_auth", {
    p_usuario_id: crmUserId,
    p_token: claimToken,
  });
  assertNoError(claimed.error, "reclamar la migración");
  if (claimed.data !== true) throw new Error("El claim local no fue exclusivo");

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { crm_user_id: crmUserId },
  });
  assertNoError(created.error, "crear identidad Auth sintética");
  if (!created.data.user) throw new Error("Auth no devolvió la identidad sintética");
  authUserId = created.data.user.id;

  const signedIn = await auth.auth.signInWithPassword({ email, password });
  assertNoError(signedIn.error, "autenticar identidad sintética");
  if (
    !signedIn.data.session ||
    !signedIn.data.user ||
    signedIn.data.user.id !== authUserId
  ) {
    throw new Error("La sesión local no corresponde a la identidad creada");
  }

  const completed = await admin.rpc("completar_migracion_auth", {
    p_usuario_id: crmUserId,
    p_token: claimToken,
    p_auth_user_id: authUserId,
  });
  assertNoError(completed.error, "completar la migración");

  const linked = await admin
    .from("usuarios")
    .select("auth_user_id,password,auth_migrated_at")
    .eq("id", crmUserId)
    .single();
  assertNoError(linked.error, "verificar la cuenta enlazada");
  if (
    linked.data?.auth_user_id !== authUserId ||
    linked.data?.password !== null ||
    !linked.data?.auth_migrated_at
  ) {
    throw new Error("La cuenta local no terminó en el estado migrado");
  }

  const enrolled = await auth.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Ensayo CI",
    issuer: "TuHipotecaFacil.cl",
  });
  assertNoError(enrolled.error, "crear factor TOTP sintético");
  if (!enrolled.data || enrolled.data.type !== "totp") {
    throw new Error("Auth no devolvió el factor TOTP sintético");
  }

  const verified = await auth.auth.mfa.challengeAndVerify({
    factorId: enrolled.data.id,
    code: currentTotp(enrolled.data.totp.secret),
  });
  assertNoError(verified.error, "verificar factor TOTP sintético");
  if (!verified.data) throw new Error("Auth no devolvió la sesión AAL2 sintética");

  const assurance = await auth.auth.mfa.getAuthenticatorAssuranceLevel(
    verified.data.access_token,
  );
  assertNoError(assurance.error, "comprobar nivel AAL2 sintético");
  if (assurance.data?.currentLevel !== "aal2") {
    throw new Error("La sesión sintética no alcanzó AAL2");
  }

  const signedOut = await admin.auth.admin.signOut(
    verified.data.access_token,
    "global",
  );
  assertNoError(signedOut.error, "revocar la sesión sintética");

  console.log("Auth bridge integration: OK");
} finally {
  if (insertedCrmUser) {
    await admin.from("usuarios").delete().eq("id", crmUserId);
  }
  if (authUserId) {
    await admin.auth.admin.deleteUser(authUserId);
  }
}
