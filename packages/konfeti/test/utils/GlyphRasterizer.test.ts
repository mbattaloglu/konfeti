import { describe, expect, it } from "vitest";

import { GlyphRasterizer } from "../../src/utils/GlyphRasterizer";

describe("GlyphRasterizer", () => {
  it("builds a valid CSS font shorthand (weight before size)", () => {
    const source = GlyphRasterizer.rasterize("YAY", "system-ui, sans-serif", "900", "#000", 20);
    const canvas = source.getImage() as HTMLCanvasElement;
    const context = canvas.getContext("2d");

    // a reversed order ("20px 900 …") is silently rejected by browsers and falls back to 10px sans-serif
    expect(context?.font).toBe("900 20px system-ui, sans-serif");
  });

  it("caches rasters and reports the glyph ratio", () => {
    const first = GlyphRasterizer.rasterize("🎉", "sans-serif", "", "#000", 32);
    const second = GlyphRasterizer.rasterize("🎉", "sans-serif", "", "#000", 32);

    expect(second).toBe(first);
    expect(first.getGlyphRatio()).toBeCloseTo(first.getHeight() / 32);
  });
});
