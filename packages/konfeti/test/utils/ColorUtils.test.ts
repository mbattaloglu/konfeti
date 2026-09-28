import { describe, expect, it } from "vitest";

import { ColorUtils } from "../../src/utils/ColorUtils";

describe("ColorUtils.parse", () => {
  it.each([
    ["#f00", { r: 255, g: 0, b: 0, a: 1 }],
    ["#ff000080", { r: 255, g: 0, b: 0, a: 128 / 255 }],
    ["#00FF00", { r: 0, g: 255, b: 0, a: 1 }],
    ["rgb(1, 2, 3)", { r: 1, g: 2, b: 3, a: 1 }],
    ["rgba(10,20,30,0.5)", { r: 10, g: 20, b: 30, a: 0.5 }],
    ["rgb(255 0 0 / 50%)", { r: 255, g: 0, b: 0, a: 0.5 }],
    ["rgb(100% 0% 0%)", { r: 255, g: 0, b: 0, a: 1 }],
  ])("parses %s", (input, expected) => {
    const color = ColorUtils.parse(input);
    expect(color.r).toBeCloseTo(expected.r);
    expect(color.g).toBeCloseTo(expected.g);
    expect(color.b).toBeCloseTo(expected.b);
    expect(color.a).toBeCloseTo(expected.a);
  });

  it.each([
    ["hsl(0 100% 50%)", [255, 0, 0]],
    ["hsl(120, 100%, 50%)", [0, 255, 0]],
    ["hsl(240deg 100% 50%)", [0, 0, 255]],
    ["hsla(0, 0%, 100%, 1)", [255, 255, 255]],
  ])("parses %s", (input, [r, g, b]) => {
    const color = ColorUtils.parse(input);
    expect(color.r).toBeCloseTo(r ?? 0);
    expect(color.g).toBeCloseTo(g ?? 0);
    expect(color.b).toBeCloseTo(b ?? 0);
  });

  it("parses named colors through the canvas", () => {
    expect(ColorUtils.parse("red")).toMatchObject({ r: 255, g: 0, b: 0 });
  });

  it("throws a TypeError for invalid colors", () => {
    expect(() => ColorUtils.parse("not-a-color")).toThrow(TypeError);
    expect(() => ColorUtils.parse("#12")).toThrow(/invalid color/);
  });
});

describe("ColorUtils.shade / toCss", () => {
  it("darkens by the given amount", () => {
    expect(ColorUtils.shade({ r: 200, g: 100, b: 50, a: 1 }, 0.5)).toEqual({
      r: 100,
      g: 50,
      b: 25,
      a: 1,
    });
  });

  it("formats opaque and translucent colors", () => {
    expect(ColorUtils.toCss({ r: 1.4, g: 2, b: 3, a: 1 })).toBe("rgb(1,2,3)");
    expect(ColorUtils.toCss({ r: 1, g: 2, b: 3, a: 0.5 })).toBe("rgba(1,2,3,0.5)");
  });
});
