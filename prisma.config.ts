// Prisma CLI reads .env by default via dotenv/config.
// We also load .env.local so DATABASE_URL works whether set in either file.
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local", override: false });
dotenv.config({ path: ".env", override: false });

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
