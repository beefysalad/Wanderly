import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
    // CI's Postgres is a fresh disposable container each run, so reusing DATABASE_URL as its own
    // shadow database there is safe (this matches what the old `--shadow-database-url` CI flag did).
    // Locally, leave it unset — migrate diff isn't run outside CI, and this keeps prisma migrate dev's
    // own separate, already-safe shadow-database handling untouched.
    shadowDatabaseUrl: process.env.CI === "true" ? env("DATABASE_URL") : undefined,
  },
});
