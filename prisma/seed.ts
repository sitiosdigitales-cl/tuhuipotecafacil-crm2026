import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Poblando base de datos...");

  // Crear usuarios
  const usuarios = [
    { nombre: "Super", apellido: "Admin", email: "admin@tuhipotecafacil.cl", password: "demo1234", rol: "SUPER_ADMIN" },
    { nombre: "Andrés", apellido: "Pérez", email: "andres.perez@tuhipotecafacil.cl", password: "demo1234", rol: "ADMIN" },
    { nombre: "Carolina", apellido: "Muñoz", email: "carolina.munoz@tuhipotecafacil.cl", password: "demo1234", rol: "GERENTE" },
    { nombre: "Diego", apellido: "Silva", email: "diego.silva@tuhipotecafacil.cl", password: "demo1234", rol: "EJECUTIVO" },
    { nombre: "Valentina", apellido: "Torres", email: "valentina.torres@tuhipotecafacil.cl", password: "demo1234", rol: "EJECUTIVO" },
    { nombre: "Javier", apellido: "Morales", email: "javier.morales@tuhipotecafacil.cl", password: "demo1234", rol: "EJECUTIVO" },
  ];

  for (const userData of usuarios) {
    const existingUser = await prisma.usuario.findUnique({
      where: { email: userData.email },
    });

    if (!existingUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      await prisma.usuario.create({
        data: {
          ...userData,
          password: hashedPassword,
        },
      });
      console.log(`✅ Usuario creado: ${userData.nombre} ${userData.apellido}`);
    }
  }

  // Crear lead de prueba
  const existingLead = await prisma.lead.findUnique({
    where: { rut: "16.567.890-1" },
  });

  if (!existingLead) {
    await prisma.lead.create({
      data: {
        nombre: "Juan Carlos",
        apellido: "Silva Muñoz",
        rut: "16.567.890-1",
        email: "juan.silva@gmail.com",
        telefono: "+56987654321",
        situacionLaboral: "INDEPENDIENTE",
        enDicom: false,
        origen: "REFERIDO",
        etapa: "DOCS_COMPLETAS",
        prioridad: "ALTA",
        banco: "Banco de Chile",
        tipoCredito: "Crédito Hipotecario",
        montoSolicitado: 150000000,
        valorPropiedad: 220000000,
        pieDisponible: 70000000,
        rentaMensual: "$3.500.000",
        nombreEjecutivo: "Andrés Pérez",
        notas: "Cliente interesado en crédito hipotecario para propiedad en Las Condes",
        diasEnEtapa: 5,
      },
    });
    console.log("✅ Lead de prueba creado: Juan Carlos Silva Muñoz (RUT: 16.567.890-1)");
  }

  // Crear leads de ejemplo
  const leadsEjemplo = [
    { nombre: "María", apellido: "González", rut: "12.345.678-5", etapa: "CONTACTADO", banco: "Santander", montoSolicitado: 120000000, valorPropiedad: 180000000, pieDisponible: 60000000 },
    { nombre: "Carlos", apellido: "Rojas", rut: "15.234.567-8", etapa: "INTERESADO", banco: "Bci", montoSolicitado: 95000000, valorPropiedad: 140000000, pieDisponible: 45000000 },
    { nombre: "Juan", apellido: "Pérez", rut: "18.765.432-1", etapa: "PREAPROBADO", banco: "Itaú", montoSolicitado: 200000000, valorPropiedad: 300000000, pieDisponible: 100000000 },
    { nombre: "Ana", apellido: "Torres", rut: "11.222.333-4", etapa: "EVALUACION_BANCARIA", banco: "Scotiabank", montoSolicitado: 80000000, valorPropiedad: 120000000, pieDisponible: 40000000 },
    { nombre: "Laura", apellido: "Sánchez", rut: "19.876.543-2", etapa: "APROBADO", banco: "Banco de Chile", montoSolicitado: 175000000, valorPropiedad: 250000000, pieDisponible: 75000000 },
  ];

  for (const leadData of leadsEjemplo) {
    const existingLead = await prisma.lead.findUnique({
      where: { rut: leadData.rut },
    });

    if (!existingLead) {
      await prisma.lead.create({
        data: {
          ...leadData,
          email: `${leadData.nombre.toLowerCase()}.${leadData.apellido.toLowerCase()}@email.cl`,
          telefono: `+569${Math.floor(Math.random() * 90000000 + 10000000)}`,
          origen: "REFERIDO",
          prioridad: "MEDIA",
          situacionLaboral: "DEPENDIENTE",
          nombreEjecutivo: "Andrés Pérez",
          diasEnEtapa: Math.floor(Math.random() * 15) + 1,
        },
      });
      console.log(`✅ Lead creado: ${leadData.nombre} ${leadData.apellido}`);
    }
  }

  console.log("\n🎉 Base de datos poblada exitosamente!");
  console.log("\n📧 Usuarios creados:");
  console.log("  - admin@tuhipotecafacil.cl / demo1234 (Super Admin)");
  console.log("  - andres.perez@tuhipotecafacil.cl / demo1234 (Admin)");
  console.log("  - carolina.munoz@tuhipotecafacil.cl / demo1234 (Gerente)");
  console.log("\n👤 Lead de prueba:");
  console.log("  - RUT: 16.567.890-1 / Juan Carlos Silva Muñoz");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
