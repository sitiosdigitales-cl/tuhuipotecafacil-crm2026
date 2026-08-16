import type { NextConfig } from "next";

const commonHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  {
    key: "Cache-Control",
    value: "no-cache, no-store, must-revalidate, proxy-revalidate, s-maxage=0",
  },
  { key: "Pragma", value: "no-cache" },
  { key: "Expires", value: "0" },
  { key: "Surrogate-Control", value: "no-store" },
];

const formContentSecurityPolicy = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'self' https://tuhipotecafacil.cl https://www.tuhipotecafacil.cl",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  // Deshabilitar caché
  experimental: {
    // Forzar revalidación en cada request
  },

  // Headers de seguridad y caché
  async headers() {
    return [
      {
        source: "/((?!formulario-leads\\.html$).*)",
        headers: [
          ...commonHeaders,
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
          },
        ],
      },
      {
        source: "/formulario-leads.html",
        headers: [
          ...commonHeaders,
          { key: "Content-Security-Policy", value: formContentSecurityPolicy },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

export default nextConfig;
