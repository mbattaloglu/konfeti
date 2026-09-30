/**
 * Shape Pixels Read Back from a Canvas.
 */
export type FormationMask = {
  /**
   * Mask Width in Pixels.
   */
  readonly width: number;
  /**
   * Mask Height in Pixels.
   */
  readonly height: number;
  /**
   * RGBA Pixel Data (4 bytes per pixel, row by row).
   */
  readonly data: Uint8ClampedArray;
  /**
   * Mask Pixels per CSS Pixel (below 1 when a large shape is read at a lower resolution).
   */
  readonly scale: number;
};
