import type { Easing } from "./Easing";
import type { Ratio } from "./Units";

/**
 * Fade-Out Settings.
 */
export type FadeOutOptions = {
  /**
   * Fade Start Point.
   * Fraction of the particle's lifetime after which it starts fading. `0.7` means it is fully visible for the
   * first 70% of its life and fades to transparent during the last 30%.
   *
   * @defaultValue `0.7`
   */
  readonly start?: Ratio;
  /**
   * Fade Curve.
   * Applied to the fade progress. `"easeInQuad"` keeps particles visible longer and drops off at the end.
   *
   * @defaultValue `"linear"`
   */
  readonly easing?: Easing;
};
