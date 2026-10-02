import { KonfetiPresets } from "konfeti";
import type { KonfetiPresetName } from "konfeti";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildInput } from "../src/buildOptions";
import { presetToEditor } from "../src/editor/presetToEditor";
import { createComparer, resolveBursts } from "./helpers/comparable";
import { createFakeAssets } from "./helpers/fakeAssets";

const assets = createFakeAssets();

/**
 * Every Built-in Preset Name.
 */
const NAMES = Object.keys(KonfetiPresets) as KonfetiPresetName[];

beforeEach(() => {
  // the seed of a burst without one comes from Math.random
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("every built-in preset", () => {
  it("is covered", () => {
    expect(NAMES).toHaveLength(21);
  });

  it.each(NAMES)("%s loads with no issue and fires the same in both build modes", (name) => {
    const compare = createComparer();
    const preset = KonfetiPresets[name];
    const { bursts, issues } = presetToEditor(preset, assets);
    const expected = resolveBursts(preset, compare);

    expect(issues).toEqual([]);
    expect(bursts).toHaveLength(Array.isArray(preset) ? preset.length : 1);
    expect(resolveBursts(buildInput(bursts, assets), compare)).toEqual(expected);
    expect(resolveBursts(buildInput(bursts, assets, { mode: "explicit" }), compare)).toEqual(
      expected,
    );

    // a second generation: what the editor sends loads and fires the same again
    const again = presetToEditor(buildInput(bursts, assets), assets);
    expect(again.issues).toEqual([]);
    expect(resolveBursts(buildInput(again.bursts, assets), compare)).toEqual(expected);
  });

  it("would notice a changed value (the comparison is not vacuous)", () => {
    const compare = createComparer();
    const [snow] = presetToEditor(KonfetiPresets.SNOW, assets).bursts;
    const [stars] = presetToEditor(KonfetiPresets.FIREFLIES, assets).bursts;

    expect(snow).toBeDefined();
    expect(stars).toBeDefined();
    expect(
      resolveBursts(buildInput([{ ...snow!, "path.d": "M0 0h4v4z" }], assets), compare),
    ).not.toEqual(resolveBursts(KonfetiPresets.SNOW, compare));
    expect(
      resolveBursts(buildInput([{ ...stars!, "image.fadeIn": 0.5 }], assets), compare),
    ).not.toEqual(resolveBursts(KonfetiPresets.FIREFLIES, compare));
  });
});
