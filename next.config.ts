import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  serverExternalPackages: ["@prisma/client", "prisma"],
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
