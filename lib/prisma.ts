import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error(
      "[prisma] DATABASE_URL is not set. Database queries will fail.",
    );
    return new PrismaClient({ log: ["error"] });
  }

  const databaseUrl = new URL(connectionString);
  databaseUrl.searchParams.delete("sslmode");
  databaseUrl.searchParams.delete("sslcert");
  databaseUrl.searchParams.delete("sslkey");
  databaseUrl.searchParams.delete("sslrootcert");

  // Supabase pooler pakai self-signed certificate.
  // Force rejectUnauthorized: false di level pg.Pool config.
  const pool = new Pool({
    connectionString: databaseUrl.toString(),
    ssl: {
      rejectUnauthorized: false,
    },
  });
  
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
