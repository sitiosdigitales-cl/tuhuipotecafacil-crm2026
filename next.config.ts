import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Excluir Prisma del bundle del cliente
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-better-sqlite3", "better-sqlite3"],
  // Optimizar para Vercel
  experimental: {
    // Reducir tamaño del build
  },
};

export default nextConfig;
