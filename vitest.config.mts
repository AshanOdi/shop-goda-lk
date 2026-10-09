import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Same "@/..." import alias as tsconfig.json, so tests import code the way the app does.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    environment: "node",
    // src/env.ts validates on import, so tests need the two required variables.
    env: {
      DATABASE_URL: "postgres://sidadiya:sidadiya@localhost:5432/sidadiya",
      BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-characters-long",
    },
    passWithNoTests: true,
  },
});
