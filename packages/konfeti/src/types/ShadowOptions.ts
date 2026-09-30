import type { ColorInput } from "./ColorInput";
import type { Pixels } from "./Units";

/**
 * Drop Shadow.
 *
 * @example
 * ```ts
 * paper: { shadow: { color: "rgba(0,0,0,0.3)", blur: 4, offsetY: 2 } }
 * ```
 * @remarks Expensive: the browser blurs every shadowed particle again on every frame, and a larger `blur` costs
 * more (measured in Chrome: about 30 particles with `blur: 14` dropped the frame rate to about 40 fps). For
 * glowing particles prefer `blendMode: "lighter"` or an `image` shape with the glow drawn in, like the
 * `FIREFLIES` preset. `adaptiveQuality` turns shadows off on slow devices.
 */
export type ShadowOptions = {
  /**
   * Shadow Color.
   *
   * @defaultValue `"rgba(0,0,0,0.25)"`
   */
  readonly color?: ColorInput;
  /**
   * Blur Radius.
   *
   * @defaultValue `4`
   */
  readonly blur?: Pixels;
  /**
   * Horizontal Offset.
   *
   * @defaultValue `0`
   */
  readonly offsetX?: Pixels;
  /**
   * Vertical Offset.
   *
   * @defaultValue `2`
   */
  readonly offsetY?: Pixels;
};
