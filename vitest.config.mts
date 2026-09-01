import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) }
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      reporter: [["text", { skipFull: false }], "html", "json-summary"],
      all: true,
      // Scoped to the surface this suite actually targets. components/** and
      // app/checkout/** are UNTESTED AND UNCOUNTED, not low-risk — several
      // known defects live there (docs/coverage-findings.md #11-#15).
      //
      // The .tsx exclusion is also forced: as of @vitest/coverage-v8 4.1.11,
      // the uncovered-file pass parses .tsx without the JSX flag and drops
      // those files with a RolldownError anyway. Recheck on upgrade — this
      // rationale expires when that is fixed.
      include: ["lib/**/*.ts", "app/api/**/*.ts"],
      exclude: ["**/*.test.ts", "tests/**"]
    }
  }
});
