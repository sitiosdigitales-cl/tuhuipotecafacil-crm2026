import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Excluir paquetes nativos que no funcionan en Vercel serverless
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-better-sqlite3",
    "better-sqlite3",
    "prisma",
  ],
};

export default nextConfig;
