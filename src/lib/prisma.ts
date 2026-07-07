// Prisma client singleton - solo funciona con prisma generate ejecutado
// En Vercel (sin generate), prisma será null y la app usa localStorage

let prismaInstance: any = null;

function getPrismaClient(): any {
  if (typeof window !== "undefined") return null;
  if (prismaInstance) return prismaInstance;

  try {
    // Intento dinámico - si prisma no fue generado, falla silenciosamente
    const { PrismaClient } = require("@prisma/client");
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

    const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
    prismaInstance = new PrismaClient({ adapter });
    return prismaInstance;
  } catch {
    return null;
  }
}

export const prisma: any = getPrismaClient();
