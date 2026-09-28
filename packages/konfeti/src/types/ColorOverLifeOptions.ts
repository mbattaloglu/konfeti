import type { ColorInput } from "./ColorInput";
import type { Easing } from "./Easing";

/**
 * Color Transition over Lifetime.
 * Each particle blends from its picked front color to `to` as it ages.
 *
 * @example
 * ```ts
 * paper: { colors: ["#fff6a0"], colorOverLife: { to: "#ff3300", easing: "easeInQuad" } } // embers
 * ```
 * @remarks Colors are precomputed into a small lookup table per palette color; no per-frame string building.
 */
export type ColorOverLifeOptions = {
  /**
   * End Color.
   */
  readonly to: ColorInput;
  /**
   * Transition Curve.
   *
   * @defaultValue `"linear"`
   */
  readonly easing?: Easing;
};
