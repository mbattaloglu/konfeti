import { KonfetiPalettes } from "konfeti";
import { describe, expect, it } from "vitest";

import type { ControlValue } from "../src/controlTypes";
import {
  acceptValue,
  applyBurstDiff,
  applyGlobalDiff,
  CONTROL_INDEX,
  deriveTheme,
  diffBurst,
  diffGlobals,
  initialBurst,
  initialGlobals,
  MAX_BURSTS,
  normalizeBurst,
  sameBurst,
  sameBursts,
} from "../src/editor/burstState";
import { DEFAULT_PALETTE } from "../src/editor/libraryDefaults";

/**
 * Accept a Value for One Control of the Table.
 *
 * @param key - Control Key
 * @param value - Untrusted Value
 * @returns Accepted Value, or Null
 */
function accept(key: string, value: unknown): ControlValue | null {
  const entry = CONTROL_INDEX.entries.get(key);

  if (entry === undefined) {
    throw new Error(`no control "${key}"`);
  }

  return acceptValue(entry, value);
}

describe("initialBurst", () => {
  it("is already normalized, with the classic theme", () => {
    const burst = initialBurst();

    expect(normalizeBurst(burst)).toEqual(burst);
    expect(burst["colorTheme"]).toBe("classic");
    expect(Object.keys(burst)).toEqual(CONTROL_INDEX.burstKeys);
  });

  it("holds no global key", () => {
    expect(initialBurst()).not.toHaveProperty("hookStart");
    expect(Object.keys(initialGlobals())).toEqual(CONTROL_INDEX.globalKeys);
    expect(MAX_BURSTS).toBe(8);
  });
});

describe("deriveTheme", () => {
  it("names the palette the colors match exactly", () => {
    expect(deriveTheme(DEFAULT_PALETTE)).toBe("classic");
    expect(deriveTheme(KonfetiPalettes.GOLD)).toBe("gold");
    expect(deriveTheme([...KonfetiPalettes.GOLD].reverse())).toBe("custom");
  });
});

describe("normalizeBurst", () => {
  it("fills missing keys with their initials, drops others and derives the theme", () => {
    const burst = normalizeBurst({
      colors: KonfetiPalettes.GOLD,
      colorTheme: "neon",
      nope: 1,
      hookStart: false,
    });

    expect(Object.keys(burst)).toEqual(CONTROL_INDEX.burstKeys);
    expect(burst["particleCount"]).toBe(60);
    expect(burst["colorTheme"]).toBe("gold");
    expect(burst).not.toHaveProperty("nope");
    expect(burst).not.toHaveProperty("hookStart");
  });
});

describe("diffBurst", () => {
  it("skips the derived theme and local upload URLs", () => {
    expect(diffBurst({ ...initialBurst(), "image.upload": "blob:x" })).toEqual({});
    expect(diffBurst({ ...initialBurst(), colorTheme: "gold" })).toEqual({});
  });

  it("returns the changed per-burst values", () => {
    expect(diffBurst({ ...initialBurst(), particleCount: 77, angle: [10, 20] })).toEqual({
      particleCount: 77,
      angle: [10, 20],
    });
  });
});

describe("applyBurstDiff", () => {
  it("refuses values a link must not bring in", () => {
    const initial = initialBurst();

    expect(applyBurstDiff({ "image.upload": "blob:x" })["image.upload"]).toBe("");
    expect(applyBurstDiff({ delay: -1 })["delay"]).toBe(0);
    expect(applyBurstDiff({ blendMode: "copy" })["blendMode"]).toBe(initial["blendMode"]);
    expect(applyBurstDiff({ colorTheme: "custom" })["colorTheme"]).toBe("classic");
    expect(applyBurstDiff({ form: ["circle", "circle"] })["form"]).toEqual(initial["form"]);
    expect(applyBurstDiff({ colors: ["red"] })["colors"]).toEqual(initial["colors"]);
    expect(applyBurstDiff({ particleCount: "x", hookStart: false, nope: 1 })).toEqual(initial);
  });

  it("sorts a crafted reversed pair", () => {
    expect(applyBurstDiff({ angle: [350, 10] })["angle"]).toEqual([10, 350]);
  });

  it("round-trips a valid diff", () => {
    const burst = normalizeBurst({
      particleCount: 120,
      angle: [-35, -20],
      lifetime: [5000, 9000],
      form: ["leaf", "circle"],
      colors: ["#ff0000", "#00ff00"],
      blendMode: "lighter",
      shadow: true,
      shadowAlpha: 0.6,
      formationText: " HI ",
      "star.enabled": true,
      "star.colors": ["#ffd700"],
      "text.fontWeight": "bold",
      attractTarget: "point",
      attractX: [0.2, 0.4],
    });
    const restored = applyBurstDiff(
      JSON.parse(JSON.stringify(diffBurst(burst))) as Record<string, unknown>,
    );

    expect(sameBurst(restored, burst)).toBe(true);
    expect(restored["colorTheme"]).toBe("custom");
  });
});

describe("acceptValue", () => {
  it("checks every control kind", () => {
    expect(accept("flip", "yes")).toBeNull();
    expect(accept("flip", false)).toBe(false);
    expect(accept("intervalTimes", 0.5)).toBeNull();
    expect(accept("gravity", [5, 1])).toEqual([1, 5]);
    expect(accept("gravity", 5)).toBeNull();
    expect(accept("aspectRatio", [0, 2])).toBeNull();
    expect(accept("colorTheme", "gold")).toBe("gold");
    expect(accept("colorTheme", "custom")).toBeNull();
    expect(accept("form", ["square", "rect"])).toEqual(["square", "rect"]);
    expect(accept("form", ["oval"])).toBeNull();
    expect(accept("trailColor", "#ABC")).toBe("#aabbcc");
    expect(accept("trailColor", "red")).toBeNull();
    expect(accept("gradientColors", ["#ff0000"])).toBeNull();
    expect(accept("gradientColors", ["#ff0000", "#0F0"])).toEqual(["#ff0000", "#00ff00"]);
    expect(accept("formationText", " HI ")).toBe(" HI ");
    expect(accept("formationUpload", "blob:x")).toBeNull();
  });
});

describe("globals", () => {
  it("diff and restore the hook toggles only", () => {
    const globals = { ...initialGlobals(), hookUpdate: true, logEvents: true };

    expect(diffGlobals(globals)).toEqual({ hookUpdate: true, logEvents: true });
    expect(applyGlobalDiff({ hookUpdate: true, logEvents: "yes", particleCount: 5 })).toEqual({
      ...initialGlobals(),
      hookUpdate: true,
    });
  });
});

describe("sameBursts", () => {
  it("ignores the derived theme and the key order", () => {
    const burst = initialBurst();
    const reordered = Object.fromEntries(Object.entries(burst).reverse());

    expect(sameBurst({ ...burst, colorTheme: "neon" }, burst)).toBe(true);
    expect(sameBursts([burst, reordered], [reordered, burst])).toBe(true);
  });

  it("sees a changed value, a missing key and a different burst count", () => {
    const burst = initialBurst();
    const partial = Object.fromEntries(
      Object.entries(burst).filter(([key]) => key !== "particleCount"),
    );

    expect(sameBurst({ ...burst, particleCount: 61 }, burst)).toBe(false);
    expect(sameBurst(partial, burst)).toBe(false);
    expect(sameBursts([burst], [burst, burst])).toBe(false);
  });
});
