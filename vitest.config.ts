import fs from "node:fs";
import path from "path";
import { defineConfig } from "vitest/config";

const pkg = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "package.json"), "utf8")
);

export default defineConfig({
  define: {
    __STUDIO_PACKAGE_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test/setup.ts"],
    // forks = stable isolation; CI bounds workers (2-core GHA) via VITEST_MAX_WORKERS.
    pool: "forks",
    ...(process.env.CI
      ? {
          maxWorkers: Number(process.env.VITEST_MAX_WORKERS || 2),
        }
      : {}),
  },
});
