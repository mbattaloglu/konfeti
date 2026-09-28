import type { Easing } from "./Easing";
import type { Multiplier } from "./Units";

/**
 * Size Transition over Lifetime.
 * Particles start at their normal size and scale toward `to` × size as they age.
 *
 * @example
 * ```ts
 * paper: { scaleOverLife: { to: 0, easing: "easeInCubic" } } // shrink away instead of fading
 * ```
 */
export type ScaleOverLifeOptions = {
  /**
   * End Size Multiplier.
   * `0` shrinks to nothing, `2` doubles.
   */
  readonly to: Multiplier;
  /**
   * Transition Curve.
   *
   * @defaultValue `"linear"`
   */
  readonly easing?: Easing;
};
