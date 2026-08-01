import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    passWithNoTests: false,
    include: ["tests/**/*.test.ts", "packages/**/*.test.ts"],
    coverage: {
      reportsDirectory: "./coverage",
    },
    projects: [
      {
        test: {
          name: "root",
          include: ["tests/**/*.test.ts"],
        },
      },
      "packages/*",
      "packages/core/*",
    ],
  },
});
