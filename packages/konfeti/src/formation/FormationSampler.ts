import { FORMATION_ALPHA_THRESHOLD, FORMATION_JITTER } from "../config/FormationDefaults";
import type { Random } from "../utils/Random";
import type { FormationMask } from "./types/FormationMask";
import type { FormationSamples } from "./types/FormationSamples";

/**
 * Static Mask Sampler.
 * Lays a jittered grid over the mask and keeps the points that land on the shape, in shuffled order: every
 * prefix of the result is an even subset, so a particle cap thins the shape out instead of cutting part of
 * it off.
 */
export class FormationSampler {
  /**
   * Sample Points of the Shape.
   *
   * @param mask - Shape Pixels
   * @param step - Grid Step in Mask Pixels (at least 1)
   * @param random - Burst Random Generator (same seed, same points)
   * @param withColors - Collect the Pixel Colors Flag
   * @returns Shuffled Points in Mask Pixels
   */
  public static sample(
    mask: FormationMask,
    step: number,
    random: Random,
    withColors: boolean,
  ): FormationSamples {
    const { width, height, data } = mask;
    const spacing = Math.max(1, step);
    const cols = Math.max(1, Math.floor(width / spacing));
    const rows = Math.max(1, Math.floor(height / spacing));
    // center the grid, so a shape is sampled the same way on both sides
    const startX = (width - (cols - 1) * spacing) / 2;
    const startY = (height - (rows - 1) * spacing) / 2;
    const jitter = spacing * FORMATION_JITTER;
    const xs: number[] = [];
    const ys: number[] = [];
    const rgb: number[] = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * spacing + (random.next() - 0.5) * jitter;
        const y = startY + row * spacing + (random.next() - 0.5) * jitter;
        const px = Math.floor(x);
        const py = Math.floor(y);

        if (px < 0 || py < 0 || px >= width || py >= height) {
          continue;
        }

        const offset = (py * width + px) * 4;

        if ((data[offset + 3] ?? 0) < FORMATION_ALPHA_THRESHOLD) {
          continue;
        }

        xs.push(x);
        ys.push(y);

        if (withColors) {
          rgb.push(data[offset] ?? 0, data[offset + 1] ?? 0, data[offset + 2] ?? 0);
        }
      }
    }

    return FormationSampler.shuffle(xs, ys, withColors ? rgb : null, random);
  }

  /**
   * Shuffle Points Together with Their Colors (Fisher–Yates on the burst's generator).
   *
   * @param xs - Horizontal Positions
   * @param ys - Vertical Positions
   * @param rgb - Colors as `r, g, b` Triples, or Null
   * @param random - Burst Random Generator
   * @returns Shuffled Samples
   */
  private static shuffle(
    xs: readonly number[],
    ys: readonly number[],
    rgb: readonly number[] | null,
    random: Random,
  ): FormationSamples {
    const count = xs.length;
    const order = Array.from({ length: count }, (_, index) => index);

    for (let index = count - 1; index > 0; index--) {
      const other = Math.floor(random.next() * (index + 1));
      const swap = order[index] ?? index;
      order[index] = order[other] ?? other;
      order[other] = swap;
    }

    const x = new Float32Array(count);
    const y = new Float32Array(count);
    const colors = rgb === null ? null : new Uint8ClampedArray(count * 3);

    for (let index = 0; index < count; index++) {
      const from = order[index] ?? index;
      x[index] = xs[from] ?? 0;
      y[index] = ys[from] ?? 0;

      if (colors !== null && rgb !== null) {
        colors[index * 3] = rgb[from * 3] ?? 0;
        colors[index * 3 + 1] = rgb[from * 3 + 1] ?? 0;
        colors[index * 3 + 2] = rgb[from * 3 + 2] ?? 0;
      }
    }

    return { count, x, y, rgb: colors };
  }
}
