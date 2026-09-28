import type { ColorInput } from "./ColorInput";

/**
 * Color with Pick Weight.
 * Used inside a color list to make some colors appear more often than others.
 *
 * @example
 * ```ts
 * colors: [{ color: "gold", weight: 3 }, "white"] // gold is picked 3× as often as white
 * ```
 */
export type WeightedColor = {
  /**
   * Color Value.
   */
  readonly color: ColorInput;
  /**
   * Relative Pick Weight.
   * Must be `> 0`. Plain (non-weighted) colors in the same list count as weight `1`.
   *
   * @defaultValue `1`
   */
  readonly weight: number;
};
