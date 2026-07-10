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

async function testLeadFlow() {
  console.log("=== Test: Flujo completo de creación de lead ===\n");

  // 1. Contar leads actuales
  const { count: beforeCount } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true });
  console.log(`1. Leads antes: ${beforeCount}`);

  // 2. Crear un lead de prueba
  const testId = crypto.randomUUID();
  const testLead = {
    id: testId,
    nombre: "María",
    apellido: "González",
    rut: "15.123.456-7",
    email: "maria.test@conexion.cl",
    telefono: "+56987654321",
    origen: "WEB",
    etapa: "NUEVO_LEAD",
    prioridad: "MEDIA",
    situacionlaboral: "DEPENDIENTE",
    endicom: false,
    tipocredito: "Crédito Hipotecario",
    banco: "Banco de Chile",
    montosolicitado: 150000000,
    valorpropiedad: 220000000,
    piedisponible: 70000000,
    notas: "Lead de prueba - verificar conexión",
    diasenetapa: 0,
    creadoen: new Date().toISOString(),
  };

  console.log("\n2. Creando lead de prueba...");
  const { data: created, error: createError } = await supabase
    .from("leads")
    .insert(testLead)
    .select()
    .single();

  if (createError) {
    console.error("   ERROR al crear:", createError.message);
    return;
  }
  console.log("   Lead creado:", created.id);
  console.log("   Nombre:", created.nombre, created.apellido);
  console.log("   Email:", created.email);

  // 3. Verificar que se guardó
  const { data: fetched, error: fetchError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", testId)
    .single();

  if (fetchError) {
    console.error("   ERROR al leer:", fetchError.message);
    return;
  }
  console.log("\n3. Lead leído de DB:");
  console.log("   Nombre:", fetched.nombre, fetched.apellido);
  console.log("   Email:", fetched.email);
  console.log("   Teléfono:", fetched.telefono);
  console.log("   Banco:", fetched.banco);
  console.log("   Monto:", fetched.montosolicitado);

  // 4. Actualizar el lead
  const { error: updateError } = await supabase
    .from("leads")
    .update({ etapa: "CONTACTADO", notas: "Lead verificado - conexión OK" })
    .eq("id", testId);

  if (updateError) {
    console.error("   ERROR al actualizar:", updateError.message);
    return;
  }
  console.log("\n4. Lead actualizado a etapa CONTACTADO");

  // 5. Verificar actualización
  const { data: updated } = await supabase
    .from("leads")
    .select("etapa, notas")
    .eq("id", testId)
    .single();
  console.log("   Etapa:", updated?.etapa);
  console.log("   Notas:", updated?.notas);

  // 6. Contar leads después
  const { count: afterCount } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true });
  console.log(`\n5. Leads después: ${afterCount}`);

  // 7. Eliminar el lead de prueba
  const { error: deleteError } = await supabase
    .from("leads")
    .delete()
    .eq("id", testId);

  if (deleteError) {
    console.error("   ERROR al eliminar:", deleteError.message);
    return;
  }
  console.log("\n6. Lead de prueba eliminado");

  // 8. Verificar eliminación
  const { count: finalCount } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true });
  console.log(`   Leads finales: ${finalCount}`);

  console.log("\n=== TODOS LOS TESTS PASARON ===");
  console.log("La conexión con Supabase funciona correctamente.");
  console.log("Cuando crees un lead desde el CRM, se guardará automáticamente.");
}

testLeadFlow().catch(console.error);
