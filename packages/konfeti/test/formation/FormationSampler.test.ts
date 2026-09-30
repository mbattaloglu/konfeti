import { describe, expect, it } from "vitest";

import { FormationSampler } from "../../src/formation/FormationSampler";
import type { FormationMask } from "../../src/formation/types/FormationMask";
import { Random } from "../../src/utils/Random";

/**
 * Build a Mask whose Pixels Are Opaque where `isInside` Says So.
 *
 * @param width - Mask Width
 * @param height - Mask Height
 * @param isInside - Opaque Pixel Test
 * @param rgb - Color of the Opaque Pixels
 * @returns Mask
 */
function mask(
  width: number,
  height: number,
  isInside: (x: number, y: number) => boolean,
  rgb: readonly [number, number, number] = [0, 0, 0],
): FormationMask {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isInside(x, y)) {
        const offset = (y * width + x) * 4;
        data.set([...rgb, 255], offset);
      }
    }
  }

  return { width, height, data, scale: 1 };
}

describe("FormationSampler", () => {
  it("keeps only points that land on the shape", () => {
    const leftHalf = mask(100, 50, (x) => x < 50);
    const samples = FormationSampler.sample(leftHalf, 5, new Random(1), false);

    expect(samples.count).toBeGreaterThan(80);
    expect(samples.count).toBeLessThanOrEqual(110);
    expect(Math.max(...samples.x)).toBeLessThan(50);
    expect(samples.rgb).toBeNull();
  });

  it("covers a full shape with about one point per spacing²", () => {
    const full = mask(80, 40, () => true);

    expect(FormationSampler.sample(full, 8, new Random(2), false).count).toBe(10 * 5);
    expect(FormationSampler.sample(full, 4, new Random(2), false).count).toBe(20 * 10);
  });

  it("is reproducible for a seed and shuffled, so any prefix is an even subset", () => {
    const full = mask(200, 100, () => true);
    const first = FormationSampler.sample(full, 5, new Random(7), false);
    const again = FormationSampler.sample(full, 5, new Random(7), false);
    const quarter = Math.floor(first.count / 4);
    const prefixX = [...first.x.slice(0, quarter)];
    const prefixY = [...first.y.slice(0, quarter)];

    expect([...again.x]).toEqual([...first.x]);
    // not row by row: the first quarter already reaches every side of the shape
    expect(Math.min(...prefixX)).toBeLessThan(20);
    expect(Math.max(...prefixX)).toBeGreaterThan(180);
    expect(Math.min(...prefixY)).toBeLessThan(15);
    expect(Math.max(...prefixY)).toBeGreaterThan(85);
  });

  it("collects the pixel colors when asked", () => {
    const red = mask(20, 20, () => true, [255, 0, 0]);
    const samples = FormationSampler.sample(red, 5, new Random(3), true);

    expect(samples.rgb).not.toBeNull();
    expect([...(samples.rgb ?? []).slice(0, 3)]).toEqual([255, 0, 0]);
    expect(samples.rgb?.length).toBe(samples.count * 3);
  });

  it("ignores pixels that are less than half opaque", () => {
    const faint = mask(20, 20, () => true);
    faint.data.forEach((_, index) => {
      if (index % 4 === 3) {
        faint.data[index] = 100;
      }
    });

    expect(FormationSampler.sample(faint, 4, new Random(4), false).count).toBe(0);
  });
});
