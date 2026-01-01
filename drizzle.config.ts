import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // Database dialect
  dialect: "sqlite",

  // Database connection
  dbCredentials: {
    url: process.env.DATABASE_PATH || "./doeit.db",
  },

  // Schema files location
  schema: "./lib/db/schema/index.ts",

  // Migrations output directory
  out: "./lib/db/migrations",

  // Verbose logging
  verbose: true,

  // Strict mode for better type safety
  strict: true,
});
