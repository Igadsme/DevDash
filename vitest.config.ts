import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "lib/analytics.ts",
        "lib/ai.ts",
        "lib/focus.ts",
        "lib/exports.ts",
        "lib/retention-policy.ts",
        "lib/scoring/**/*.ts",
        "lib/security/webhooks.ts",
        "lib/validation.ts",
        "lib/providers/{github,gitlab,bitbucket,http}.ts",
      ],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 55 },
      reporter: ["text", "json-summary"],
    },
  },
});
