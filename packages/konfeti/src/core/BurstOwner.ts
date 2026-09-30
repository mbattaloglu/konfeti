import type { RenderSurface } from "./RenderSurface";

/**
 * Burst Owner Contract.
 * Lets a burst ask its engine for a frame after `resume()` or `stop()`, and for the surface a formation is
 * laid out on.
 */
export type BurstOwner = {
  /**
   * Request Animation Frame.
   */
  requestFrame(): void;
  /**
   * Return the Drawing Surface.
   *
   * @returns Drawing Surface
   */
  getSurface(): RenderSurface;
};
