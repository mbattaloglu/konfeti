import type { OneOrMany } from "../OneOrMany";
import type { Range } from "../Range";
import type { Pixels } from "../Units";
import type { ShapeEntryBase } from "./ShapeEntryBase";

/**
 * Custom Vector Path Shape Entry.
 * Draws any SVG path (`d` attribute) or `Path2D`, filled with the particle color.
 *
 * @example
 * ```ts
 * shapes: [{
 *   type: "path",
 *   path: "M12 2l3 7h7l-5.5 4 2 7-6.5-4.5L5.5 20l2-7L2 9h7z",
 *   viewBox: [24, 24],
 * }]
 * ```
 */
export type PathShapeOptions = ShapeEntryBase & {
  /**
   * Shape Type.
   */
  readonly type: "path";
  /**
   * SVG Path Data or Path2D.
   * A list picks one per particle.
   */
  readonly path: OneOrMany<string | Path2D>;
  /**
   * Path Coordinate Box as `[width, height]`.
   * The path is centered in this box and scaled so its longer side equals `size`.
   *
   * @defaultValue `[24, 24]`
   */
  readonly viewBox?: readonly [width: number, height: number];
  /**
   * Rendered Size (longer side of the view box).
   *
   * @defaultValue `[12, 18]`
   */
  readonly size?: Range<Pixels>;
};
