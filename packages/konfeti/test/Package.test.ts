// @vitest-environment node
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { VERSION } from "../src/lite";

/**
 * Package Manifest Subset Checked by Tests.
 */
type Manifest = { readonly sideEffects: unknown; readonly version: string };

const manifest = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as Manifest;

describe("package.json", () => {
  it("keeps the full entry's built-in shape registration as a side effect", () => {
    // with `sideEffects: false` bundlers drop `registerShapes(...BUILTIN_SHAPES)` from dist/index.js
    expect(manifest.sideEffects).toEqual(
      expect.arrayContaining(["./dist/index.js", "./dist/index.cjs", "./dist/konfeti.iife.js"]),
    );
  });

  it("keeps the other entries' registration too (worker entry; the site bundles the sources)", () => {
    // without it, a production site build drops the call and only paper works (only dev looked fine)
    expect(manifest.sideEffects).toEqual(
      expect.arrayContaining([
        "./src/index.ts",
        "./src/workerEntry.ts",
        "./dist/worker.js",
        "./dist/worker.cjs",
      ]),
    );
  });

  it("exports the same VERSION as the manifest", () => {
    expect(VERSION).toBe(manifest.version);
  });
});
