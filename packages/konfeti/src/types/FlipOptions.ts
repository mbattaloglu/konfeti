import type { FlipAxis } from "./FlipAxis";
import type { Range } from "./Range";
import type { Hertz } from "./Units";

/**
 * 3D Flip Settings.
 * The flip squashes the paper along an axis and shows the back side (`backColor`) while it faces away.
 */
export type FlipOptions = {
  /**
   * Flip Speed.
   * Full turns per second. `1` flips the paper over and back once per second.
   *
   * @defaultValue `[0.6, 1.8]`
   */
  readonly frequency?: Range<Hertz>;
  /**
   * Flip Axis.
   *
   * @defaultValue `"x"`
   */
  readonly axis?: FlipAxis;
};
