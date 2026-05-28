import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            port: "",
            pathname: "/storage/v1/object/sign/avatars/**",
          },
        ]
      : [],
  },
  // pg dan adapter-pg harus external agar native bindings-nya tidak di-bundle
  // oleh webpack/turbopack — mereka butuh Node.js runtime langsung
  serverExternalPackages: ["@prisma/client", "prisma", "pg", "@prisma/adapter-pg"],
  // allowedDevOrigins only needed for local LAN dev
  ...(process.env.NODE_ENV !== "production" && {
    allowedDevOrigins: ["192.168.110.41", "192.168.100.6"],
  }),
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
