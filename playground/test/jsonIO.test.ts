import { describe, expect, it } from "vitest";

import { parseJson, toJson } from "../src/jsonIO";
import { createFakeAssets } from "./helpers/fakeAssets";

/**
 * Demo Asset Stand-Ins Shared by Every Case.
 */
const assets = createFakeAssets();

/**
 * Read `formation.image` of Parsed Fire Input.
 *
 * @param input - Parsed Fire Input
 * @returns The Formation Image, or Undefined
 */
function formationImageOf(input: unknown): unknown {
  return (input as { formation?: { image?: unknown } }).formation?.image;
}

describe("JSON panel", () => {
  it("writes the demo logo as a placeholder and reads the same canvas back", () => {
    const text = toJson({ formation: { image: assets.logoCanvas } }, assets);

    expect(text).toContain('"$asset:logoCanvas"');
    expect(formationImageOf(parseJson(text, assets))).toBe(assets.logoCanvas);
  });

  it("leaves out an element without a placeholder", () => {
    const text = toJson({ formation: { image: document.createElement("canvas") } }, assets);

    expect(JSON.parse(text)).toEqual({ formation: {} });
  });

  it("drops hook keys, which JSON cannot fill with a function", () => {
    expect(parseJson('{"onParticleUpdate":5,"particleCount":10}', assets)).toEqual({
      particleCount: 10,
    });
    expect(parseJson('[{"onComplete":"x"},{"spread":30}]', assets)).toEqual([{}, { spread: 30 }]);
    // only burst-level keys are hooks
    expect(parseJson('{"physics":{"onStart":1}}', assets)).toEqual({ physics: { onStart: 1 } });
  });
});
