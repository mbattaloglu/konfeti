import type { Range } from "../Range";
import type { Pixels, Ratio } from "../Units";
import type { ShapeEntryBase } from "./ShapeEntryBase";

/**
 * Star Shape Entry.
 *
 * @example
 * ```ts
 * shapes: [{ type: "star", points: [5, 6], innerRatio: 0.45, colors: ["gold", "#fff3b0"] }]
 * ```
 */
export type StarShapeOptions = ShapeEntryBase & {
  /**
   * Shape Type.
   */
  readonly type: "star";
  /**
   * Outer Diameter.
   *
   * @defaultValue `[10, 16]`
   */
  readonly size?: Range<Pixels>;
  /**
   * Number of Points.
   * Rounded to whole numbers, clamped to `3–12`. A range mixes star types.
   *
   * @defaultValue `5`
   */
  readonly points?: Range;
  /**
   * Inner Radius Ratio.
   * Inner point distance relative to the outer radius. Lower = spikier.
   *
   * @defaultValue `0.5`
   */
  readonly innerRatio?: Ratio;
};
