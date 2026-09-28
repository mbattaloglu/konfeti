import type { Range } from "../Range";
import type { Pixels } from "../Units";
import type { ShapeEntryBase } from "./ShapeEntryBase";

/**
 * Heart Shape Entry.
 */
export type HeartShapeOptions = ShapeEntryBase & {
  /**
   * Shape Type.
   */
  readonly type: "heart";
  /**
   * Heart Width.
   *
   * @defaultValue `[10, 16]`
   */
  readonly size?: Range<Pixels>;
};
