#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONFIRMATION = "RESET_SUPER_ADMIN";

function required(env, name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Falta ${name}`);
  return value;
}

function validName(value, field) {
  const normalized = value.trim();
  if (!normalized || normalized.length > 100 || /[\u0000-\u001f\u007f]/.test(normalized)) {
    throw new Error(`${field} no es válido`);
  }
  return normalized;
}

function validPassword(password, email) {
  const localPart = email.split("@", 1)[0].toLowerCase();
  const strong =
    password.length >= 16 &&
    password.length <= 128 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password) &&
    !password.toLowerCase().includes(localPart);
  if (!strong) {
    throw new Error(
      "BOOTSTRAP_ADMIN_PASSWORD debe tener 16-128 caracteres, mayúscula, minúscula, número y símbolo, sin contener el correo"
    );
  }
  return password;
}

function authMode(env) {
  const mode = env.SUPABASE_AUTH_MODE?.trim() || "legacy";
  if (!["legacy", "bridge", "required"].includes(mode)) {
    throw new Error("SUPABASE_AUTH_MODE no es válido");
  }
  return mode;
}

export function readBootstrapConfig(env = process.env) {
  if (env.BOOTSTRAP_CONFIRM !== CONFIRMATION) {
    throw new Error(`Define BOOTSTRAP_CONFIRM=${CONFIRMATION} para confirmar el cambio`);
  }

  const url = new URL(required(env, "NEXT_PUBLIC_SUPABASE_URL"));
  const local = ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL debe usar HTTPS");
  }

  const email = required(env, "BOOTSTRAP_ADMIN_EMAIL").toLowerCase();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw new Error("BOOTSTRAP_ADMIN_EMAIL no es válido");
  }

  return {
    url: url.toString(),
    serviceRoleKey: required(env, "SUPABASE_SERVICE_ROLE_KEY"),
    email,
    password: validPassword(required(env, "BOOTSTRAP_ADMIN_PASSWORD"), email),
    nombre: validName(required(env, "BOOTSTRAP_ADMIN_NAME"), "BOOTSTRAP_ADMIN_NAME"),
    apellido: validName(required(env, "BOOTSTRAP_ADMIN_LAST_NAME"), "BOOTSTRAP_ADMIN_LAST_NAME"),
    authMode: authMode(env),
  };
}

async function findAuthUserByEmail(supabase, email) {
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1_000,
    });
    if (error) throw new Error("No se pudo consultar el directorio de Auth");
    const found = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
    if (found) return found;
    if (data.users.length < 1_000) return null;
  }
  throw new Error("El directorio de Auth excede el límite de recuperación");
}

async function prepareAuthIdentity(supabase, { crmUserId, authUserId, email, password }) {
  if (authUserId) {
    const { error } = await supabase.auth.admin.updateUserById(authUserId, {
      email,
      password,
      email_confirm: true,
      ban_duration: "none",
      app_metadata: { crm_user_id: crmUserId },
    });
    if (error) throw new Error("No se pudo recuperar la identidad de Auth");
    return { authUserId, created: false };
  }

  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { crm_user_id: crmUserId },
  });
  if (!created.error && created.data.user) {
    return { authUserId: created.data.user.id, created: true };
  }

  if (!["email_exists", "user_already_exists"].includes(created.error?.code)) {
    throw new Error("No se pudo crear la identidad de Auth");
  }
  const existing = await findAuthUserByEmail(supabase, email);
  if (!existing || existing.app_metadata?.crm_user_id !== crmUserId) {
    throw new Error("El correo pertenece a otra identidad de Auth");
  }
  const { error } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    ban_duration: "none",
  });
  if (error) throw new Error("No se pudo recuperar la identidad existente");
  return { authUserId: existing.id, created: false };
}

export async function bootstrapAdmin(
  env = process.env,
  {
    clientFactory = createClient,
    hashPassword = (password) => bcrypt.hash(password, 12),
  } = {},
) {
  const config = readBootstrapConfig(env);
  const supabase = clientFactory(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  const { data: existing, error: lookupError } = await supabase
    .from("usuarios")
    .select(config.authMode === "legacy" ? "id" : "id,auth_user_id")
    .eq("email", config.email)
    .maybeSingle();
  if (lookupError) throw new Error(`No se pudo consultar la cuenta: ${lookupError.message}`);

  const crmUserId = existing?.id || randomUUID();
  let createdAuthIdentity = false;
  let authUserId = null;
  let passwordHash = null;
  if (config.authMode === "legacy") {
    passwordHash = await hashPassword(config.password);
  } else {
    const identity = await prepareAuthIdentity(supabase, {
      crmUserId,
      authUserId: existing?.auth_user_id || null,
      email: config.email,
      password: config.password,
    });
    authUserId = identity.authUserId;
    createdAuthIdentity = identity.created;
  }

  const account = {
    nombre: config.nombre,
    apellido: config.apellido,
    email: config.email,
    password: passwordHash,
    rol: "SUPER_ADMIN",
    estado: "ACTIVO",
    intentosfallidos: 0,
    suspendidohasta: null,
    ...(authUserId
      ? {
          auth_user_id: authUserId,
          auth_migrated_at: new Date().toISOString(),
        }
      : {}),
  };

  const result = existing
    ? await supabase.from("usuarios").update(account).eq("id", existing.id)
    : await supabase.from("usuarios").insert({
        id: crmUserId,
        ...account,
        creadoen: new Date().toISOString(),
      });

  if (result.error) {
    if (createdAuthIdentity && authUserId) {
      await supabase.auth.admin.deleteUser(authUserId).catch(() => null);
    }
    throw new Error(`No se pudo preparar la cuenta: ${result.error.message}`);
  }
  return { created: !existing };
}

const executedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (executedDirectly) {
  bootstrapAdmin()
    .then(({ created }) => {
      console.log(created ? "Cuenta SUPER_ADMIN creada" : "Cuenta SUPER_ADMIN recuperada");
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : "No se pudo preparar la cuenta");
      process.exitCode = 1;
    });
}
