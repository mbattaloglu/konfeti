import type { Range } from "../Range";
import type { Pixels } from "../Units";
import type { ShapeEntryBase } from "./ShapeEntryBase";

/**
 * Triangle Shape Entry.
 * Equilateral triangle.
 */
export type TriangleShapeOptions = ShapeEntryBase & {
  /**
   * Shape Type.
   */
  readonly type: "triangle";
  /**
   * Side Length.
   *
   * @defaultValue `[8, 14]`
   */
  readonly size?: Range<Pixels>;
};
