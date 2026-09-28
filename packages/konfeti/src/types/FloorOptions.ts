import type { Ratio } from "./Units";

/**
 * Floor Collision Settings.
 * Particles bounce off a horizontal line and then rest there until their lifetime ends.
 */
export type FloorOptions = {
  /**
   * Floor Position.
   * Normalized canvas height (`1` = bottom edge).
   *
   * @defaultValue `1`
   */
  readonly y?: Ratio;
  /**
   * Bounciness.
   * Fraction of vertical speed kept after a bounce. `0` = no bounce, `1` = perfectly elastic.
   *
   * @defaultValue `0.35`
   */
  readonly bounce?: Ratio;
  /**
   * Floor Friction.
   * Fraction of horizontal speed and spin lost per bounce.
   *
   * @defaultValue `0.4`
   */
  readonly friction?: Ratio;
};
