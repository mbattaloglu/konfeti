import { afterEach, describe, expect, it, vi } from "vitest";

import { GlyphRasterizer } from "../../src/utils/GlyphRasterizer";

/**
 * Install a Fake `document.fonts` (happy-dom has none).
 *
 * @param fonts - Fake Font Set
 */
function stubFonts(fonts: Pick<FontFaceSet, "check" | "load">): void {
  Object.defineProperty(document, "fonts", { value: fonts, configurable: true });
}

afterEach(() => {
  Reflect.deleteProperty(document, "fonts");
});

describe("GlyphRasterizer", () => {
  it("redraws a cached glyph once its web font finishes loading", async () => {
    let finishLoading: () => void = () => undefined;
    stubFonts({
      check: () => false,
      load: async () =>
        new Promise((resolve) => {
          finishLoading = () => {
            resolve([]);
          };
        }),
    });

    const source = GlyphRasterizer.rasterize("A", "PlayableFont", "700", "#fff", 30);
    const fallback = source.getImage();
    finishLoading();

    await vi.waitFor(() => {
      expect(source.getImage()).not.toBe(fallback);
    });
    // the cache still hands out the same (now updated) source
    expect(GlyphRasterizer.rasterize("A", "PlayableFont", "700", "#fff", 30)).toBe(source);
  });

  it("does not wait for fonts that are already available", () => {
    const load = vi.fn(async () => Promise.resolve([]));
    stubFonts({ check: () => true, load });

    GlyphRasterizer.rasterize("B", "system-ui", "", "#fff", 30);

    expect(load).not.toHaveBeenCalled();
  });

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
