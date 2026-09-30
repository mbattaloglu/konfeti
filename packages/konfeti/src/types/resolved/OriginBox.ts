import type { RangeTuple } from "../Range";

/**
 * Origin as Pixel Ranges in Canvas Space.
 */
export type OriginBox = {
  /**
   * Horizontal Range in Pixels.
   */
  readonly x: RangeTuple;
  /**
   * Vertical Range in Pixels.
   */
  readonly y: RangeTuple;
};
