import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Creando usuarios de prueba...");

  const usuarios = [
    { nombre: "Super", apellido: "Admin", email: "admin@tuhipotecafacil.cl", password: "demo1234", rol: "SUPER_ADMIN" },
    { nombre: "Andrés", apellido: "Pérez", email: "andres.perez@tuhipotecafacil.cl", password: "demo1234", rol: "ADMIN" },
    { nombre: "Carolina", apellido: "Muñoz", email: "carolina.munoz@tuhipotecafacil.cl", password: "demo1234", rol: "GERENTE" },
    { nombre: "Diego", apellido: "Silva", email: "diego.silva@tuhipotecafacil.cl", password: "demo1234", rol: "AGENTE" },
    { nombre: "Valentina", apellido: "Torres", email: "valentina.torres@tuhipotecafacil.cl", password: "demo1234", rol: "AGENTE" },
    { nombre: "Javier", apellido: "Morales", email: "javier.morales@tuhipotecafacil.cl", password: "demo1234", rol: "AGENTE" },
    { nombre: "Roberto", apellido: "Silva", email: "roberto.silva@tuhipotecafacil.cl", password: "demo1234", rol: "GERENTE" },
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
          nombre: userData.nombre,
          apellido: userData.apellido,
          email: userData.email,
          password: hashedPassword,
          rol: userData.rol,
          estado: "ACTIVO",
        },
      });
      console.log(`  ✅ ${userData.nombre} ${userData.apellido} (${userData.email})`);
    } else {
      console.log(`  ⏭️ ${userData.email} ya existe`);
    }
  }

  console.log("\n✅ Usuarios creados correctamente");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
