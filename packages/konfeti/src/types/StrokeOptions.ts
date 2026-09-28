import type { ColorInput } from "./ColorInput";
import type { Range } from "./Range";
import type { Pixels } from "./Units";

/**
 * Outline Settings.
 */
export type StrokeOptions = {
  /**
   * Outline Color.
   *
   * @example
   * ```ts
   * stroke: { color: "white", width: 1 }
   * ```
   */
  readonly color: ColorInput;
  /**
   * Outline Thickness.
   * In particle-local pixels, so the outline scales with `scale` and squashes with the 3D flip.
   *
   * @defaultValue `1`
   */
  readonly width?: Range<Pixels>;
};
