import type { Range } from "./Range";
import type { Hertz, PixelsPerSecondSquared } from "./Units";

/**
 * Swirl Settings.
 * Adds a rotating push to each particle so it drifts in loops, like leaves in a breeze.
 */
export type SwirlOptions = {
  /**
   * Push Strength.
   *
   * @defaultValue `[80, 200]`
   */
  readonly strength?: Range<PixelsPerSecondSquared>;
  /**
   * Loop Speed.
   *
   * @defaultValue `[0.3, 0.8]`
   */
  readonly frequency?: Range<Hertz>;
};
