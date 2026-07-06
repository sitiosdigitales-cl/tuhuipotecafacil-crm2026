import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrisma(): PrismaClient | null {
  if (typeof window !== "undefined") {
    return null;
  }

  if (!globalForPrisma.prisma) {
    try {
      const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
      globalForPrisma.prisma = new PrismaClient({ adapter });
    } catch (error) {
      console.error("Error inicializando Prisma:", error);
      return null;
    }
  }

  return globalForPrisma.prisma;
}

export const prisma = getPrisma();

export function isPrismaAvailable(): boolean {
  return prisma !== null;
}
