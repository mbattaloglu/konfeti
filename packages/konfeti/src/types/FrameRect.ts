import type { Pixels } from "./Units";

/**
 * Spritesheet Frame Rectangle in Source Pixels.
 */
export type FrameRect = {
  /**
   * Left Edge.
   */
  readonly x: Pixels;
  /**
   * Top Edge.
   */
  readonly y: Pixels;
  /**
   * Frame Width.
   */
  readonly width: Pixels;
  /**
   * Frame Height.
   */
  readonly height: Pixels;
};
