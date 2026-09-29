import { fileURLToPath } from "node:url";

import { defineConfig } from "tsdown";

// the <script> build loads konfeti.worker.js from next to itself, so it swaps the inlined script for an empty one
const WORKER_SOURCE_STUB = fileURLToPath(
  new URL("src/worker/WorkerSourceStub.ts", import.meta.url),
);

export default defineConfig([
  {
    entry: { index: "src/index.ts", lite: "src/lite.ts" },
    format: ["esm", "cjs"],
    platform: "browser",
    target: "es2022",
    dts: true,
    sourcemap: true,
    clean: true,
    fixedExtension: false,
  },
  {
    entry: { konfeti: "src/iife.ts" },
    format: "iife",
    plugins: [
      {
        name: "konfeti:external-worker-script",
        resolveId: (source) => (source === "./generated/WorkerSource" ? WORKER_SOURCE_STUB : null),
      },
    ],
    globalName: "konfeti",
    platform: "browser",
    target: "es2022",
    minify: true,
    sourcemap: true,
    dts: false,
    clean: false,
    fixedExtension: false,
    outExtensions: () => ({ js: ".js" }),
  },
]);
