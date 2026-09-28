import type { Range } from "./Range";
import type { Ratio } from "./Units";

/**
 * Normalized Spawn Point.
 * `0,0` is the canvas' top-left corner, `1,1` its bottom-right. Ranges spawn along a line or inside an area.
 *
 * @example
 * ```ts
 * origin: { x: 0.5, y: 0.6 }            // slightly below center
 * origin: { x: [0, 1], y: 0 }            // anywhere along the top edge (snow)
 * ```
 */
export type OriginPoint = {
  /**
   * Horizontal Position.
   *
   * @defaultValue `0.5`
   */
  readonly x?: Range<Ratio>;
  /**
   * Vertical Position.
   *
   * @defaultValue `0.6`
   */
  readonly y?: Range<Ratio>;
};
