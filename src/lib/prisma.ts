// Prisma client singleton para PostgreSQL
// En Vercel usa DATABASE_URL, localmente usa SQLite

let prismaInstance: any = null;

function getPrismaClient(): any {
  if (typeof window !== "undefined") return null;
  if (prismaInstance) return prismaInstance;

  try {
    const { PrismaClient } = require("@prisma/client");
    
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
    return prismaInstance;
  } catch {
    return null;
  }
}

export const prisma: any = getPrismaClient();
