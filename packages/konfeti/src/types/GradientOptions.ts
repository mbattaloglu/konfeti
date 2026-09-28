import type { ColorInput } from "./ColorInput";
import type { Degrees } from "./Units";

/**
 * Linear Gradient Fill.
 * Replaces the flat front color. The gradient is laid across the particle's own box, so it rotates, flips
 * and scales with the particle. The back side (when flipped) still uses `backColor`.
 *
 * @example
 * ```ts
 * paper: { gradient: { colors: ["#ffd700", "#ff8c00"], angle: 45 } }
 * ```
 * @remarks Creates one `CanvasGradient` per particle at spawn time (no per-frame cost).
 */
export type GradientOptions = {
  /**
   * Gradient Color Stops.
   * At least two colors, spread evenly from start to end.
   */
  readonly colors: readonly [ColorInput, ColorInput, ...ColorInput[]];
  /**
   * Gradient Direction.
   * `0` runs left → right, `90` bottom → top.
   *
   * @defaultValue `90`
   */
  readonly angle?: Degrees;
};
