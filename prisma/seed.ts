import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Limpiando datos existentes...");
  await prisma.actividad.deleteMany();
  await prisma.documento.deleteMany();
  await prisma.tarea.deleteMany();
  await prisma.lead.deleteMany();

  console.log("Creando leads de ejemplo...");

  const leads = [
    {
      nombre: "María",
      apellido: "González",
      rut: "15.234.567-8",
      email: "maria.gonzalez@email.com",
      telefono: "+56 9 1234 5678",
      origen: "WEB",
      etapa: "DOCS_COMPLETAS",
      prioridad: "ALTA",
      banco: "Banco Estado",
      tipoCredito: "Hipotecario",
      montoSolicitado: 150000000,
      valorPropiedad: 180000000,
      pieDisponible: 30000000,
      situacionLaboral: "DEPENDIENTE",
      enDicom: false,
      rentaMensual: "Entre $1.400.000 y $1.600.000",
      complementarRenta: false,
      cuentaPie: true,
    },
    {
      nombre: "Carlos",
      apellido: "Rojas",
      rut: "18.345.678-9",
      email: "carlos.rojas@email.com",
      telefono: "+56 9 2345 6789",
      origen: "FACEBOOK",
      etapa: "CALIFICACION_COMERCIAL",
      prioridad: "MEDIA",
      banco: "Santander",
      tipoCredito: "Hipotecario",
      montoSolicitado: 120000000,
      valorPropiedad: 150000000,
      pieDisponible: 30000000,
      situacionLaboral: "INDEPENDIENTE",
      enDicom: false,
      rentaMensual: "Entre $1.800.000 y $2.000.000",
      complementarRenta: false,
      cuentaPie: false,
    },
    {
      nombre: "Juan",
      apellido: "Pérez",
      rut: "12.456.789-0",
      email: "juan.perez@email.com",
      telefono: "+56 9 3456 7890",
      origen: "REFERIDO",
      etapa: "EVALUACION_BANCARIA",
      prioridad: "ALTA",
      banco: "Banco de Chile",
      tipoCredito: "Hipotecario",
      montoSolicitado: 200000000,
      valorPropiedad: 250000000,
      pieDisponible: 50000000,
      situacionLaboral: "DEPENDIENTE",
      enDicom: false,
      rentaMensual: "Entre $2.000.000 y $2.200.000",
      complementarRenta: true,
      cuentaPie: true,
    },
    {
      nombre: "Ana",
      apellido: "Torres",
      rut: "16.567.890-1",
      email: "ana.torres@email.com",
      telefono: "+56 9 4567 8901",
      origen: "WHATSAPP",
      etapa: "INTERESADO",
      prioridad: "URGENTE",
      banco: "Banco BCI",
      tipoCredito: "Comercial",
      montoSolicitado: 180000000,
      valorPropiedad: 220000000,
      pieDisponible: 40000000,
      situacionLaboral: "INDEPENDIENTE",
      enDicom: true,
      dicomDetalle: "Moratoria menor, ya regularizada",
      rentaMensual: "Entre $2.200.000 y $2.400.000",
      complementarRenta: false,
      cuentaPie: false,
    },
    {
      nombre: "Diego",
      apellido: "Díaz",
      rut: "17.678.901-2",
      email: "diego.diaz@email.com",
      telefono: "+56 9 5678 9012",
      origen: "INSTAGRAM",
      etapa: "PREAPROBADO",
      prioridad: "MEDIA",
      banco: "Banco Scotiabank",
      tipoCredito: "Hipotecario",
      montoSolicitado: 160000000,
      valorPropiedad: 200000000,
      pieDisponible: 40000000,
      situacionLaboral: "DEPENDIENTE",
      enDicom: false,
      rentaMensual: "Entre $1.600.000 y $1.800.000",
      complementarRenta: false,
      cuentaPie: true,
    },
    {
      nombre: "Sofía",
      apellido: "Martínez",
      rut: "19.789.012-3",
      email: "sofia.martinez@email.com",
      telefono: "+56 9 6789 0123",
      origen: "GOOGLE",
      etapa: "DOCS_PENDIENTES",
      prioridad: "BAJA",
      banco: "Banco Itaú",
      tipoCredito: "Solar",
      montoSolicitado: 80000000,
      valorPropiedad: 120000000,
      pieDisponible: 40000000,
      situacionLaboral: "DEPENDIENTE",
      enDicom: false,
      rentaMensual: "Entre $1.200.000 y $1.400.000",
      complementarRenta: false,
      cuentaPie: false,
    },
    {
      nombre: "Roberto",
      apellido: "Silva",
      rut: "11.890.123-4",
      email: "roberto.silva@email.com",
      telefono: "+56 9 7890 1234",
      origen: "LINKEDIN",
      etapa: "APROBADO",
      prioridad: "ALTA",
      banco: "Banco Estado",
      tipoCredito: "Hipotecario",
      montoSolicitado: 250000000,
      valorPropiedad: 320000000,
      pieDisponible: 70000000,
      situacionLaboral: "INDEPENDIENTE",
      enDicom: false,
      rentaMensual: "Entre $3.000.000 y $3.200.000",
      complementarRenta: false,
      cuentaPie: true,
    },
    {
      nombre: "Fernanda",
      apellido: "Rojas",
      rut: "14.901.234-5",
      email: "fernanda.rojas@email.com",
      telefono: "+56 9 8901 2345",
      origen: "TIKTOK",
      etapa: "CONTACTADO",
      prioridad: "MEDIA",
      banco: "",
      tipoCredito: "",
      montoSolicitado: 100000000,
      valorPropiedad: 130000000,
      pieDisponible: 30000000,
      situacionLaboral: "DEPENDIENTE",
      enDicom: false,
      rentaMensual: "Entre $1.000.000 y $1.200.000",
      complementarRenta: false,
      cuentaPie: false,
    },
  ];

  for (const leadData of leads) {
    await prisma.lead.create({
      data: leadData,
    });
  }

  console.log(`✅ ${leads.length} leads creados correctamente`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
