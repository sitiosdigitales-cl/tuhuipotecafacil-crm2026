require('dotenv').config();
const { createClient } = require("@supabase/supabase-js");

async function setup() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(url, key);

  const { error: testError } = await supabase.from("bancos").select("id").limit(1);
  
  if (testError && testError.message.includes("does not exist")) {
    console.log("Table does not exist. Please create it in Supabase dashboard:");
    console.log("SQL: docs/add_bancos_table.sql");
    return;
  } else if (testError) {
    console.log("Error:", testError.message);
    return;
  }

  const BANCOS = require("./src/modulos/bancos/types").BANCOS_POR_DEFECTO;
  
  for (const banco of BANCOS) {
    const { error } = await supabase.from("bancos").upsert({
      nombre: banco.nombre, color: banco.color, estado: banco.estado, convenio: banco.convenio,
      tasa_base: banco.tasaBase, tasa_preferencial: banco.tasaPreferencial, cae: banco.cae,
      financiamiento_maximo: banco.financiamientoMaximo, plazo_maximo: banco.plazoMaximo,
      pie_minimo: banco.pieMinimo, pie_maximo: banco.pieMaximo, prepago: banco.prepago,
      complemento_renta: banco.complementoRenta, independientes: banco.independientes,
      empresas: banco.empresas, productos: banco.productos, requisitos: banco.requisitos,
      contacto_nombre: banco.contactoNombre, contacto_email: banco.contactoEmail,
      contacto_telefono: banco.contactoTelefono, contacto_whatsapp: banco.contactoWhatsapp,
      sucursal: banco.sucursal, region: banco.region, horario_atencion: banco.horarioAtencion,
      tiempo_aprobacion: banco.tiempoAprobacion, tiempo_escrituracion: banco.tiempoEscrituracion,
      tiempo_pago: banco.tiempoPago, comision_convenio: banco.comisionConvenio,
      requisitos_minimos: banco.requisitosMinimos, tasas_por_tipo: banco.tasasPorTipo,
    }, { onConflict: "nombre" });
    if (error) console.error("Error:", banco.nombre, error.message);
    else console.log("OK:", banco.nombre);
  }
  console.log("Done!");
}

setup().catch(console.error);