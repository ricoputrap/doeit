import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    globals: true,
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "vitest.setup.ts",
        "**/*.d.ts",
        "**/*.config.{js,ts}",
        ".next/",
        "out/",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
