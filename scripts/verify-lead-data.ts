import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function verifyLeadData() {
  console.log("=== Verificación completa de leads ===\n");

  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .order("creadoen", { ascending: false });

  if (error) {
    console.log("Error:", error.message);
    return;
  }

  if (!leads || leads.length === 0) {
    console.log("No hay leads en la base de datos");
    return;
  }

  for (const lead of leads) {
    console.log(`\n--- ${lead.nombre} ${lead.apellido} ---`);
    console.log(`ID: ${lead.id}`);
    console.log(`RUT: ${lead.rut}`);
    console.log(`Email: ${lead.email || "No registrado"}`);
    console.log(`Teléfono: ${lead.telefono || "No registrado"}`);
    console.log(`Etapa: ${lead.etapa}`);
    console.log(`Prioridad: ${lead.prioridad}`);
    console.log(`Banco: ${lead.banco || "Sin banco"}`);
    console.log(`Tipo Crédito: ${lead.tipocredito || "No definido"}`);
    console.log(`Monto: ${lead.montosolicitado ? `$${lead.montosolicitado.toLocaleString()}` : "No definido"}`);

    // Datos personales extendidos
    console.log("\n  [Datos Personales]");
    console.log(`  Cargas Legales: ${lead.cargaslegales || "No especificado"}`);
    console.log(`  Estado Civil: ${lead.estadocivil || "No especificado"}`);
    console.log(`  Régimen Matrimonial: ${lead.regimenmatrimonial || "No especificado"}`);
    console.log(`  Fecha Nacimiento: ${lead.fechanacimiento || "No especificado"}`);
    console.log(`  Estudios: ${lead.estudios || "No especificado"}`);
    console.log(`  Profesión: ${lead.profesion || "No especificado"}`);
    console.log(`  Domicilio: ${lead.domicilioparticular || "No especificado"}`);
    console.log(`  Comuna/Ciudad: ${lead.comunaciudad || "No especificado"}`);
    console.log(`  Valor Arriendo: ${lead.valorarriendo ? `$${lead.valorarriendo.toLocaleString()}` : "No aplica"}`);
    console.log(`  AFP: ${lead.afp || "No especificado"}`);

    // Datos del empleador
    console.log("\n  [Datos del Empleador]");
    console.log(`  Nombre Empleador: ${lead.nombreempleador || "No especificado"}`);
    console.log(`  RUT Empresa: ${lead.rutfactura || "No especificado"}`);
    console.log(`  Fecha Ingreso: ${lead.fechaingreso || "No especificado"}`);
    console.log(`  Cargo: ${lead.cargo || "No especificado"}`);
    console.log(`  Renta Líquida: ${lead.rentaliquida ? `$${lead.rentaliquida.toLocaleString()}` : "No especificado"}`);
    console.log(`  Banco Abono Renta: ${lead.bancoabonorenta || "No especificado"}`);
    console.log(`  Fecha Pago: ${lead.fechapago || "No especificado"}`);
    console.log(`  Dirección Laboral: ${lead.direccionlaboral || "No especificado"}`);
    console.log(`  Comuna/Ciudad Laboral: ${lead.comunaciudadlaboral || "No especificado"}`);
    console.log(`  Teléfono Laboral: ${lead.telefonolaboralfijo || "No especificado"}`);
    console.log(`  Email Laboral: ${lead.emaillaboral || "No especificado"}`);
    console.log(`  Otros Ingresos: ${lead.otrosingresos || "No especificado"}`);

    // Verificar campos vacíos
    const camposVacios = [
      lead.cargaslegales, lead.estadocivil, lead.regimenmatrimonial,
      lead.fechanacimiento, lead.estudios, lead.profesion,
      lead.domicilioparticular, lead.comunaciudad, lead.afp,
      lead.nombreempleador, lead.rutfactura, lead.fechaingreso,
      lead.cargo, lead.rentaliquida, lead.bancoabonorenta,
      lead.fechapago, lead.direccionLaboral, lead.comunaciudadlaboral,
      lead.telefonolaboralfijo, lead.emaillaboral, lead.otrosingresos
    ].filter(v => !v).length;

    console.log(`\n  Campos vacíos: ${camposVacios} de 22 campos extendidos`);
  }

  console.log(`\n=== Total: ${leads.length} leads ===`);
}

verifyLeadData();
