import { describe, expect, it } from "vitest";

import { CONTROL_INDEX } from "../src/editor/burstState";
import {
  composeColor,
  deriveTheme,
  formatExact,
  hexOf,
  inDomain,
  isNumberPair,
  pairOf,
  parseNumberEntry,
  parseSpanEntry,
  rangeOf,
  sameValue,
  splitColor,
} from "../src/editor/optionValues";
import type { ValueDomain } from "../src/controlTypes";

/**
 * Size-Like Spans Whose Product Must Stay Finite (the canvas throws on a gradient across an overflowing size).
 */
const SIZE_KEYS = [
  "scale",
  "width",
  "height",
  "ribbon.length",
  "star.size",
  "triangle.size",
  "polygon.size",
  "heart.size",
  "path.size",
  "emoji.size",
  "text.size",
  "image.size",
  "sprite.size",
] as const;

/**
 * Return the Domain of a Control in the Table.
 *
 * @param key - Control Key
 * @returns Domain (undefined for a control without one)
 */
function domainOf(key: string): ValueDomain | undefined {
  return CONTROL_INDEX.entries.get(key)?.domain;
}

describe("pairOf", () => {
  it("reads every range form the way the library does", () => {
    expect(pairOf(5)).toEqual([5, 5]);
    expect(pairOf([1, 2])).toEqual([1, 2]);
    expect(pairOf([2, 1])).toEqual([1, 2]);
    expect(pairOf({ min: 1, max: 2 })).toEqual([1, 2]);
    expect(pairOf({ min: 2, max: 1 })).toEqual([1, 2]);
    // items after the first two are ignored, as the library does
    expect(pairOf([1, 2, 3])).toEqual([1, 2]);
  });

  it("refuses what the library would reject", () => {
    expect(pairOf([1])).toBeNull();
    expect(pairOf(Number.NaN)).toBeNull();
    expect(pairOf([1, Infinity])).toBeNull();
    expect(pairOf({ min: 1 })).toBeNull();
    expect(pairOf("1")).toBeNull();
  });
});

describe("rangeOf", () => {
  it("collapses an equal pair to a number", () => {
    expect(rangeOf([5, 5])).toBe(5);
    expect(rangeOf([1, 2])).toEqual([1, 2]);
  });
});

describe("isNumberPair and sameValue", () => {
  it("accept exactly two finite numbers", () => {
    expect(isNumberPair([1, 2])).toBe(true);
    expect(isNumberPair([2, 1])).toBe(true);
    expect(isNumberPair([1, 2, 3])).toBe(false);
    expect(isNumberPair(["1", "2"])).toBe(false);
    expect(isNumberPair([1, Number.NaN])).toBe(false);
  });

  it("compare lists item by item, so -0 equals 0", () => {
    expect(sameValue([-0, 1], [0, 1])).toBe(true);
    expect(sameValue(["a", "b"], ["b", "a"])).toBe(false);
    expect(sameValue(1, 1)).toBe(true);
  });
});

describe("formatExact", () => {
  it("hides float noise without rounding to a step", () => {
    expect(formatExact(0.15000000000000002)).toBe("0.15");
    expect(formatExact(-0)).toBe("0");
    expect(formatExact(2147483648)).toBe("2147483648");
    expect(formatExact(0.123456)).toBe("0.123456");
  });
});

describe("parseNumberEntry", () => {
  it("reads typed numbers, a decimal comma included", () => {
    expect(parseNumberEntry("1,5")).toBe(1.5);
    expect(parseNumberEntry(" -8 ")).toBe(-8);
    expect(Object.is(parseNumberEntry("-0"), 0)).toBe(true);
  });

  it("refuses empty and unparsable text", () => {
    expect(parseNumberEntry("")).toBeNull();
    expect(parseNumberEntry("   ")).toBeNull();
    expect(parseNumberEntry("abc")).toBeNull();
    expect(parseNumberEntry("Infinity")).toBeNull();
  });
});

describe("parseSpanEntry", () => {
  it("reads the two fields of a span editor", () => {
    // the linked-max case: both fields hold the same text
    expect(parseSpanEntry("-8", "-8")).toEqual([-8, -8]);
    expect(parseSpanEntry("5", "")).toEqual([5, 5]);
    expect(parseSpanEntry("", "5")).toEqual([5, 5]);
    expect(parseSpanEntry("9", "2")).toEqual([2, 9]);
    expect(parseSpanEntry("1,5", "2")).toEqual([1.5, 2]);
  });

  it("refuses two empty fields and any unparsable field", () => {
    expect(parseSpanEntry("", "")).toBeNull();
    expect(parseSpanEntry("x", "2")).toBeNull();
    expect(parseSpanEntry("1", "x")).toBeNull();
  });
});

describe("inDomain", () => {
  it("applies the table's domains", () => {
    expect(inDomain(domainOf("delay"), -1)).toBe(false);
    expect(inDomain(domainOf("delay"), 0)).toBe(true);
    expect(inDomain(domainOf("streamDuration"), 0)).toBe(false);
    expect(inDomain(domainOf("intervalTimes"), 0.5)).toBe(false);
    expect(inDomain(domainOf("intervalTimes"), 1)).toBe(true);
    expect(inDomain(domainOf("intervalTimes"), 2.5)).toBe(true);
    expect(inDomain(domainOf("aspectRatio"), [0, 2])).toBe(false);
    expect(inDomain(domainOf("aspectRatio"), [0.5, 2])).toBe(true);
    expect(inDomain(domainOf("shadowAlpha"), -0.5)).toBe(false);
    expect(inDomain(domainOf("shadowAlpha"), 2)).toBe(false);
    expect(inDomain(domainOf("star.weight"), 0)).toBe(false);
    expect(inDomain(domainOf("attractRadius"), -5)).toBe(false);
  });

  it("bounds the values that would stall the frame loop", () => {
    // the library advances one sprite frame per loop step
    expect(inDomain(domainOf("sprite.fps"), [1e18, 1e18])).toBe(false);
    expect(inDomain(domainOf("sprite.fps"), [-1, 12])).toBe(false);
    expect(inDomain(domainOf("sprite.fps"), [0, 60])).toBe(true);
    expect(inDomain(domainOf("sprite.fps"), [1000, 1000])).toBe(true);
    // every interval shot that is due fires in one loop
    expect(inDomain(domainOf("intervalEvery"), 1e-9)).toBe(false);
    expect(inDomain(domainOf("intervalEvery"), 0)).toBe(false);
    expect(inDomain(domainOf("intervalEvery"), 1)).toBe(true);
    expect(inDomain(domainOf("intervalTimes"), 1e12)).toBe(false);
    expect(inDomain(domainOf("intervalTimes"), 1000)).toBe(true);
  });

  it.each(SIZE_KEYS)("keeps %s finite enough for a gradient", (key) => {
    expect(inDomain(domainOf(key), [1e308, 1e308])).toBe(false);
    // a span samples between its bounds, so a huge negative minimum overflows as well
    expect(inDomain(domainOf(key), [-1e308, 1e308])).toBe(false);
    expect(inDomain(domainOf(key), [-1, 5])).toBe(true);
    expect(inDomain(domainOf(key), [1e6, 1e6])).toBe(true);
  });

  it("bounds the aspect ratio and the path view box", () => {
    expect(inDomain(domainOf("aspectRatio"), [1e308, 1e308])).toBe(false);
    expect(inDomain(domainOf("aspectRatio"), [0.5, 1e6])).toBe(true);
    // the side ratio of the view box scales the drawn height
    expect(inDomain(domainOf("path.viewBox"), 1e-300)).toBe(false);
    expect(inDomain(domainOf("path.viewBoxHeight"), 1e300)).toBe(false);
    expect(inDomain(domainOf("path.viewBox"), 0)).toBe(false);
    expect(inDomain(domainOf("path.viewBox"), 1)).toBe(true);
    expect(inDomain(domainOf("path.viewBoxHeight"), 0.5)).toBe(true);
  });

  it("accepts 0 and floored counts from 1 up in a zero-allowed domain", () => {
    const frameCount: ValueDomain = { min: 1, floored: true, zeroAllowed: true };

    expect(inDomain(frameCount, 0)).toBe(true);
    expect(inDomain(frameCount, 3)).toBe(true);
    expect(inDomain(frameCount, 0.5)).toBe(false);
    expect(inDomain(frameCount, -1)).toBe(false);
  });

  it("accepts every finite number without a domain", () => {
    expect(domainOf("particleCount")).toBeUndefined();
    expect(inDomain(domainOf("particleCount"), 5000)).toBe(true);
    expect(inDomain(undefined, Number.NaN)).toBe(false);
  });
});

describe("colors", () => {
  it("composes the library default shadow color exactly", () => {
    expect(composeColor("#000000", 0.25)).toBe("rgba(0,0,0,0.25)");
    expect(composeColor("#ff8000", 1)).toBe("#ff8000");
  });

  it("splits colors into a hex color and an opacity", () => {
    expect(splitColor("rgba(0,0,0,0.25)")).toEqual({ hex: "#000000", alpha: 0.25 });
    expect(splitColor("#fff")).toEqual({ hex: "#ffffff", alpha: 1 });
    expect(splitColor("rgb(255, 128, 0)")).toEqual({ hex: "#ff8000", alpha: 1 });
    expect(splitColor("rgba(300,0,0,1)")).toBeNull();
    expect(splitColor("hsl(0 100% 50%)")).toBeNull();
  });

  it("reads #rgb and #rrggbb only, as lowercase #rrggbb", () => {
    expect(hexOf("#ABC")).toBe("#aabbcc");
    expect(hexOf("#A0B1C2")).toBe("#a0b1c2");
    expect(hexOf("#abcd")).toBeNull();
    expect(hexOf("red")).toBeNull();
  });

  it("derives the theme from the color list", () => {
    expect(deriveTheme(["#ff0000"])).toBe("custom");
  });
});
