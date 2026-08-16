#!/usr/bin/env node

import { randomUUID } from "node:crypto";

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

function assertNoError(error, operation) {
  if (error) throw new Error(`Falló el ensayo local: ${operation}`);
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

  const signedOut = await admin.auth.admin.signOut(
    signedIn.data.session.access_token,
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
