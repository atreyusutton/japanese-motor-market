import { config as loadDotenv } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load .env.local (Next.js convention), then .env as a fallback
loadDotenv({ path: ".env.local" });
loadDotenv({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
