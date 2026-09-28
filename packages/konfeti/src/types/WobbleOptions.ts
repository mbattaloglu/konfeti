import type { Range } from "./Range";
import type { Hertz, Pixels } from "./Units";

/**
 * Side-to-Side Flutter Settings.
 * Adds a sinusoidal horizontal sway on top of the physical motion, like paper drifting through air.
 */
export type WobbleOptions = {
  /**
   * Sway Distance.
   * Maximum horizontal offset from the particle's physical path.
   *
   * @defaultValue `[2, 8]`
   */
  readonly amplitude?: Range<Pixels>;
  /**
   * Sway Speed.
   * Full left-right-left cycles per second.
   *
   * @defaultValue `[0.4, 1.2]`
   */
  readonly frequency?: Range<Hertz>;
};
