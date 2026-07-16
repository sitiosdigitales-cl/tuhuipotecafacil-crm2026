// Seed script: insert initial bank data
// Run with: node -e "require('./src/modulos/bancos/seed.js').seed()"

const { createClient } = require("@supabase/supabase-js");
const BANCOS = require("./types").BANCOS_POR_DEFECTO;

async function seed() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("Missing Supabase credentials");
    process.exit(1);
  }
  const supabase = createClient(url, key);

  for (const banco of BANCOS) {
    const { error } = await supabase.from("bancos").upsert({
      nombre: banco.nombre,
      color: banco.color,
      estado: banco.estado,
      convenio: banco.convenio,
      tasa_base: banco.tasaBase,
      tasa_preferencial: banco.tasaPreferencial,
      cae: banco.cae,
      financiamiento_maximo: banco.financiamientoMaximo,
      plazo_maximo: banco.plazoMaximo,
      pie_minimo: banco.pieMinimo,
      pie_maximo: banco.pieMaximo,
      prepago: banco.prepago,
      complemento_renta: banco.complementoRenta,
      independientes: banco.independientes,
      empresas: banco.empresas,
      productos: banco.productos,
      requisitos: banco.requisitos,
      contacto_nombre: banco.contactoNombre,
      contacto_email: banco.contactoEmail,
      contacto_telefono: banco.contactoTelefono,
      contacto_whatsapp: banco.contactoWhatsapp,
      sucursal: banco.sucursal,
      region: banco.region,
      horario_atencion: banco.horarioAtencion,
      tiempo_aprobacion: banco.tiempoAprobacion,
      tiempo_escrituracion: banco.tiempoEscrituracion,
      tiempo_pago: banco.tiempoPago,
      comision_convenio: banco.comisionConvenio,
      requisitos_minimos: banco.requisitosMinimos,
      tasas_por_tipo: banco.tasasPorTipo,
    }, { onConflict: "nombre" });

    if (error) console.error(`Error seeding ${banco.nombre}:`, error.message);
    else console.log(`Seeded: ${banco.nombre}`);
  }
  console.log("Seed complete!");
}

module.exports = { seed };
if (require.main === module) seed();