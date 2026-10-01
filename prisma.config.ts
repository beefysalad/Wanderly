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
    // Locally, leave it unset so Prisma keeps auto-creating/dropping its own real shadow database —
    // Prisma "soft resets" whatever shadowDatabaseUrl points to, which would wipe local dev data.
    shadowDatabaseUrl: process.env.CI ? env("DATABASE_URL") : undefined,
  },
});
