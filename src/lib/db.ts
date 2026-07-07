// Prisma client singleton - solo funciona con prisma generate ejecutado
// En Vercel (sin generate), prisma será null y la app usa localStorage

let prismaInstance: any = null;

function getPrisma(): any {
  if (typeof window !== "undefined") return null;
  if (prismaInstance) return prismaInstance;

  try {
    const { PrismaClient } = require("@prisma/client");
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

    const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
    prismaInstance = new PrismaClient({ adapter });
    return prismaInstance;
  } catch {
    return null;
  }
}

export const prisma = getPrisma();

export function isPrismaAvailable(): boolean {
  return prisma !== null;
}
