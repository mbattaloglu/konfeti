import type { Range } from "../Range";
import type { Pixels } from "../Units";
import type { ShapeEntryBase } from "./ShapeEntryBase";

/**
 * Regular Polygon Shape Entry.
 *
 * @example
 * ```ts
 * shapes: [{ type: "polygon", sides: [5, 8] }]
 * ```
 */
export type PolygonShapeOptions = ShapeEntryBase & {
  /**
   * Shape Type.
   */
  readonly type: "polygon";
  /**
   * Diameter.
   *
   * @defaultValue `[8, 14]`
   */
  readonly size?: Range<Pixels>;
  /**
   * Number of Sides.
   * Rounded to whole numbers, clamped to `3–12`.
   *
   * @defaultValue `6`
   */
  readonly sides?: Range;
};
