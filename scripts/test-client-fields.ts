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

async function testClientFields() {
  console.log("=== Test: Campos del Cliente ===\n");

  // 1. Crear lead de prueba con todos los campos
  const leadId = crypto.randomUUID();
  const testLead = {
    id: leadId,
    nombre: "Juan",
    apellido: "Pérez",
    rut: `19.${Date.now().toString().slice(-6)}-K`,
    email: `juan.${Date.now()}@test.cl`,
    telefono: "+56912345678",
    origen: "WEB",
    etapa: "NUEVO_LEAD",
    prioridad: "MEDIA",
    situacionlaboral: "DEPENDIENTE",
    endicom: false,
    diasenetapa: 0,
    // Datos personales extendidos
    cargaslegales: "Caja Compensación Los Andes",
    estadocivil: "Casado/a",
    regimenmatrimonial: "Separación de Bienes",
    fechanacimiento: "1985-05-15",
    estudios: "Universitario",
    profesion: "Ingeniero Civil",
    domicilioparticular: "Av. Providencia 1234",
    comunaciudad: "Las Condes",
    valorarriendo: 500000,
    afp: "Capital",
    // Datos del empleador
    nombreempleador: "Empresa Test SpA",
    rutfactura: "76.123.456-7",
    fechaingreso: "2020-01-15",
    cargo: "Gerente de Proyectos",
    rentaliquida: 2500000,
    bancoabonorenta: "Banco Estado",
    fechapago: "5",
    direccionlaboral: "Av. Las Condes 5678",
    comunaciudadlaboral: "Las Condes",
    telefonolaboralfijo: "+56223456789",
    emaillaboral: "juan@empresa.cl",
    otrosingresos: "Arriendo de departamento: $500.000 mensuales",
  };

  console.log("1. Creando lead con todos los campos...");
  const { error: createError } = await supabase.from("leads").insert(testLead);
  if (createError) {
    console.error("   ERROR al crear:", createError.message);
    return;
  }
  console.log("   Lead creado:", leadId);

  // 2. Leer el lead y verificar que todos los campos se guardaron
  console.log("\n2. Verificando campos guardados...");
  const { data: lead, error: readError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (readError || !lead) {
    console.error("   ERROR al leer:", readError?.message);
    return;
  }

  // Verificar cada campo
  const campos = [
    { nombre: "nombre", esperado: "Juan", actual: lead.nombre },
    { nombre: "apellido", esperado: "Pérez", actual: lead.apellido },
    { nombre: "rut", esperado: "12.345.678-9", actual: lead.rut },
    { nombre: "email", esperado: "juan.perez@test.cl", actual: lead.email },
    { nombre: "cargasLegales", esperado: "Caja Compensación Los Andes", actual: lead.cargaslegales },
    { nombre: "estadoCivil", esperado: "Casado/a", actual: lead.estadocivil },
    { nombre: "regimenMatrimonial", esperado: "Separación de Bienes", actual: lead.regimenmatrimonial },
    { nombre: "fechaNacimiento", esperado: "1985-05-15", actual: lead.fechanacimiento },
    { nombre: "estudios", esperado: "Universitario", actual: lead.estudios },
    { nombre: "profesion", esperado: "Ingeniero Civil", actual: lead.profesion },
    { nombre: "domicilioParticular", esperado: "Av. Providencia 1234", actual: lead.domicilioparticular },
    { nombre: "comunaCiudad", esperado: "Las Condes", actual: lead.comunaciudad },
    { nombre: "valorArriendo", esperado: 500000, actual: lead.valorarriendo },
    { nombre: "afp", esperado: "Capital", actual: lead.afp },
    { nombre: "nombreEmpleador", esperado: "Empresa Test SpA", actual: lead.nombreempleador },
    { nombre: "rutEmpresa", esperado: "76.123.456-7", actual: lead.rutfactura },
    { nombre: "fechaIngreso", esperado: "2020-01-15", actual: lead.fechaingreso },
    { nombre: "cargo", esperado: "Gerente de Proyectos", actual: lead.cargo },
    { nombre: "rentaLiquida", esperado: 2500000, actual: lead.rentaliquida },
    { nombre: "bancoAbonoRenta", esperado: "Banco Estado", actual: lead.bancoabonorenta },
    { nombre: "fechaPago", esperado: "5", actual: lead.fechapago },
    { nombre: "direccionLaboral", esperado: "Av. Las Condes 5678", actual: lead.direccionlaboral },
    { nombre: "comunaCiudadLaboral", esperado: "Las Condes", actual: lead.comunaciudadlaboral },
    { nombre: "telefonoLaboralFijo", esperado: "+56223456789", actual: lead.telefonolaboralfijo },
    { nombre: "emailLaboral", esperado: "juan@empresa.cl", actual: lead.emaillaboral },
    { nombre: "otrosIngresos", esperado: "Arriendo de departamento: $500.000 mensuales", actual: lead.otrosingresos },
  ];

  let errores = 0;
  for (const campo of campos) {
    const ok = campo.actual === campo.esperado;
    console.log(`   ${ok ? "✓" : "✗"} ${campo.nombre}: ${ok ? "OK" : `ERROR (esperado: ${campo.esperado}, actual: ${campo.actual})`}`);
    if (!ok) errores++;
  }

  // 3. Actualizar algunos campos
  console.log("\n3. Actualizando campos...");
  const { error: updateError } = await supabase
    .from("leads")
    .update({
      cargaslegales: "Sin carga",
      estadocivil: "Soltero/a",
      cargo: "Director",
      rentaliquida: 3000000,
    })
    .eq("id", leadId);

  if (updateError) {
    console.error("   ERROR al actualizar:", updateError.message);
    return;
  }
  console.log("   Campos actualizados");

  // 4. Verificar actualización
  console.log("\n4. Verificando actualización...");
  const { data: leadActualizado } = await supabase
    .from("leads")
    .select("cargaslegales,estadocivil,cargo,rentaliquida")
    .eq("id", leadId)
    .single();

  if (leadActualizado) {
    console.log(`   cargasLegales: ${leadActualizado.cargaslegales === "Sin carga" ? "✓ OK" : "✗ ERROR"}`);
    console.log(`   estadoCivil: ${leadActualizado.estadocivil === "Soltero/a" ? "✓ OK" : "✗ ERROR"}`);
    console.log(`   cargo: ${leadActualizado.cargo === "Director" ? "✓ OK" : "✗ ERROR"}`);
    console.log(`   rentaLiquida: ${leadActualizado.rentaliquida === 3000000 ? "✓ OK" : "✗ ERROR"}`);
  }

  // 5. Eliminar lead de prueba
  console.log("\n5. Limpiando...");
  await supabase.from("leads").delete().eq("id", leadId);
  console.log("   Lead eliminado");

  console.log(`\n=== RESULTADO: ${errores === 0 ? "TODOS LOS CAMPOS GUARDAN CORRECTAMENTE" : `${errores} ERRORES`} ===`);
}

testClientFields().catch(console.error);
