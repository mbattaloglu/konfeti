import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Resolve a Path Relative to This Config.
 *
 * @param path - Relative Path
 * @returns Absolute Path
 */
const local = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  resolve: {
    // the library source (not dist/), so tests share the shape and formation registries with the deep imports
    alias: [
      { find: /^konfeti$/, replacement: local("../packages/konfeti/src/index.ts") },
      { find: /^konfeti\/worker$/, replacement: local("../packages/konfeti/src/workerEntry.ts") },
    ],
  },
  test: {
    environment: "happy-dom",
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.ts"],
    // keeps runs light on the developer's machine
    maxWorkers: 2,
  },
});
