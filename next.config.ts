import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  // pg dan adapter-pg harus external agar native bindings-nya tidak di-bundle
  // oleh webpack/turbopack — mereka butuh Node.js runtime langsung
  serverExternalPackages: ["@prisma/client", "prisma", "pg", "@prisma/adapter-pg"],
  // allowedDevOrigins only needed for local LAN dev
  ...(process.env.NODE_ENV !== "production" && {
    allowedDevOrigins: ["192.168.110.41"],
  }),
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
