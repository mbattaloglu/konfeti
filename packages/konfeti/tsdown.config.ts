import { defineConfig } from "tsdown";

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
    entry: { konfeti: "src/index.ts" },
    format: "iife",
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
