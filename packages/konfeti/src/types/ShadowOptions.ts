import type { ColorInput } from "./ColorInput";
import type { Pixels } from "./Units";

/**
 * Drop Shadow.
 *
 * @example
 * ```ts
 * paper: { shadow: { color: "rgba(0,0,0,0.3)", blur: 4, offsetY: 2 } }
 * ```
 * @remarks Canvas shadows are expensive (roughly 2–5× draw cost). Prefer small particle counts.
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
