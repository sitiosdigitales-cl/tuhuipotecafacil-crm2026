import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Deshabilitar caché
  experimental: {
    // Forzar revalidación en cada request
  },

  // Headers de seguridad y caché
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate, proxy-revalidate, s-maxage=0" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
          { key: "Surrogate-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
