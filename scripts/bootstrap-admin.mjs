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
  };
}

export async function bootstrapAdmin(env = process.env) {
  const config = readBootstrapConfig(env);
  const supabase = createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  const passwordHash = await bcrypt.hash(config.password, 12);

  const { data: existing, error: lookupError } = await supabase
    .from("usuarios")
    .select("id")
    .eq("email", config.email)
    .maybeSingle();
  if (lookupError) throw new Error(`No se pudo consultar la cuenta: ${lookupError.message}`);

  const account = {
    nombre: config.nombre,
    apellido: config.apellido,
    email: config.email,
    password: passwordHash,
    rol: "SUPER_ADMIN",
    estado: "ACTIVO",
    intentosfallidos: 0,
    suspendidohasta: null,
  };

  const result = existing
    ? await supabase.from("usuarios").update(account).eq("id", existing.id)
    : await supabase.from("usuarios").insert({
        id: randomUUID(),
        ...account,
        creadoen: new Date().toISOString(),
      });

  if (result.error) {
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
