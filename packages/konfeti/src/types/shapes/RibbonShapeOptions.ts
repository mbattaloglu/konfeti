import type { Range } from "../Range";
import type { Pixels, Ratio } from "../Units";
import type { ShapeEntryBase } from "./ShapeEntryBase";

/**
 * Curly Ribbon (Streamer) Shape Entry.
 * A long, wavy band — looks best with `flip: { axis: "y" }` and slower gravity.
 *
 * @example
 * ```ts
 * shapes: [{ type: "ribbon", length: [24, 40], waves: 3 }]
 * ```
 */
export type RibbonShapeOptions = ShapeEntryBase & {
  /**
   * Shape Type.
   */
  readonly type: "ribbon";
  /**
   * Ribbon Length.
   *
   * @defaultValue `[18, 30]`
   */
  readonly length?: Range<Pixels>;
  /**
   * Band Thickness Relative to Length.
   *
   * @defaultValue `0.14`
   */
  readonly thickness?: Ratio;
  /**
   * Number of Curls.
   * Half sine waves along the length (whole numbers, `1–8`).
   *
   * @defaultValue `2`
   */
  readonly waves?: number;
};
