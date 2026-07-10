import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Variables de entorno de Supabase no configuradas");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanLeads() {
  console.log("Eliminando leads de prueba...");

  const { count, error: countError } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("Error al contar leads:", countError);
    return;
  }

  console.log(`Leads encontrados: ${count}`);

  if (count === 0) {
    console.log("No hay leads para eliminar");
    return;
  }

  const { error } = await supabase
    .from("leads")
    .delete()
    .not("id", "is", null); // Eliminar todos

  if (error) {
    console.error("Error al eliminar leads:", error);
    return;
  }

  console.log("Leads eliminados exitosamente");
}

async function cleanClientes() {
  console.log("Eliminando clientes de prueba...");

  // Verificar si existe la tabla clientes
  const { count, error: countError } = await supabase
    .from("clientes")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.log("Tabla clientes no existe o está vacía");
    return;
  }

  console.log(`Clientes encontrados: ${count}`);

  if (count === 0) {
    console.log("No hay clientes para eliminar");
    return;
  }

  const { error } = await supabase
    .from("clientes")
    .delete()
    .not("id", "is", null);

  if (error) {
    console.error("Error al eliminar clientes:", error);
    return;
  }

  console.log("Clientes eliminados exitosamente");
}

async function cleanActividades() {
  console.log("Eliminando actividades de prueba...");

  const { count, error: countError } = await supabase
    .from("actividades")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.log("Tabla actividades no existe o está vacía");
    return;
  }

  console.log(`Actividades encontradas: ${count}`);

  if (count === 0) {
    console.log("No hay actividades para eliminar");
    return;
  }

  const { error } = await supabase
    .from("actividades")
    .delete()
    .not("id", "is", null);

  if (error) {
    console.error("Error al eliminar actividades:", error);
    return;
  }

  console.log("Actividades eliminadas exitosamente");
}

async function cleanDocumentos() {
  console.log("Eliminando documentos de prueba...");

  const { count, error: countError } = await supabase
    .from("documentos")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.log("Tabla documentos no existe o está vacía");
    return;
  }

  console.log(`Documentos encontrados: ${count}`);

  if (count === 0) {
    console.log("No hay documentos para eliminar");
    return;
  }

  const { error } = await supabase
    .from("documentos")
    .delete()
    .not("id", "is", null);

  if (error) {
    console.error("Error al eliminar documentos:", error);
    return;
  }

  console.log("Documentos eliminados exitosamente");
}

async function cleanNotificaciones() {
  console.log("Eliminando notificaciones de prueba...");

  const { count, error: countError } = await supabase
    .from("notificaciones")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.log("Tabla notificaciones no existe o está vacía");
    return;
  }

  console.log(`Notificaciones encontradas: ${count}`);

  if (count === 0) {
    console.log("No hay notificaciones para eliminar");
    return;
  }

  const { error } = await supabase
    .from("notificaciones")
    .delete()
    .not("id", "is", null);

  if (error) {
    console.error("Error al eliminar notificaciones:", error);
    return;
  }

  console.log("Notificaciones eliminadas exitosamente");
}

async function cleanMensajes() {
  console.log("Eliminando mensajes de prueba...");

  const { count, error: countError } = await supabase
    .from("mensajes")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.log("Tabla mensajes no existe o está vacía");
    return;
  }

  console.log(`Mensajes encontrados: ${count}`);

  if (count === 0) {
    console.log("No hay mensajes para eliminar");
    return;
  }

  const { error } = await supabase
    .from("mensajes")
    .delete()
    .not("id", "is", null);

  if (error) {
    console.error("Error al eliminar mensajes:", error);
    return;
  }

  console.log("Mensajes eliminados exitosamente");
}

async function cleanConversaciones() {
  console.log("Eliminando conversaciones de prueba...");

  const { count, error: countError } = await supabase
    .from("conversaciones")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.log("Tabla conversaciones no existe o está vacía");
    return;
  }

  console.log(`Conversaciones encontradas: ${count}`);

  if (count === 0) {
    console.log("No hay conversaciones para eliminar");
    return;
  }

  const { error } = await supabase
    .from("conversaciones")
    .delete()
    .not("id", "is", null);

  if (error) {
    console.error("Error al eliminar conversaciones:", error);
    return;
  }

  console.log("Conversaciones eliminadas exitosamente");
}

async function cleanTareas() {
  console.log("Eliminando tareas de prueba...");

  const { count, error: countError } = await supabase
    .from("tareas")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.log("Tabla tareas no existe o está vacía");
    return;
  }

  console.log(`Tareas encontradas: ${count}`);

  if (count === 0) {
    console.log("No hay tareas para eliminar");
    return;
  }

  const { error } = await supabase
    .from("tareas")
    .delete()
    .not("id", "is", null);

  if (error) {
    console.error("Error al eliminar tareas:", error);
    return;
  }

  console.log("Tareas eliminadas exitosamente");
}

async function cleanEventos() {
  console.log("Eliminando eventos de prueba...");

  const { count, error: countError } = await supabase
    .from("eventos")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.log("Tabla eventos no existe o está vacía");
    return;
  }

  console.log(`Eventos encontrados: ${count}`);

  if (count === 0) {
    console.log("No hay eventos para eliminar");
    return;
  }

  const { error } = await supabase
    .from("eventos")
    .delete()
    .not("id", "is", null);

  if (error) {
    console.error("Error al eliminar eventos:", error);
    return;
  }

  console.log("Eventos eliminados exitosamente");
}

async function cleanRecordatorios() {
  console.log("Eliminando recordatorios de prueba...");

  const { count, error: countError } = await supabase
    .from("recordatorios")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.log("Tabla recordatorios no existe o está vacía");
    return;
  }

  console.log(`Recordatorios encontrados: ${count}`);

  if (count === 0) {
    console.log("No hay recordatorios para eliminar");
    return;
  }

  const { error } = await supabase
    .from("recordatorios")
    .delete()
    .not("id", "is", null);

  if (error) {
    console.error("Error al eliminar recordatorios:", error);
    return;
  }

  console.log("Recordatorios eliminados exitosamente");
}

async function main() {
  console.log("=== Limpieza completa de datos de prueba ===\n");

  await cleanLeads();
  await cleanClientes();
  await cleanActividades();
  await cleanDocumentos();
  await cleanMensajes();
  await cleanConversaciones();
  await cleanTareas();
  await cleanEventos();
  await cleanRecordatorios();
  await cleanNotificaciones();

  console.log("\n=== Limpieza completada ===");
}

main().catch(console.error);
