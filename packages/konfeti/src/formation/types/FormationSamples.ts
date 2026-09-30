/**
 * Points Sampled from a Mask (mask pixel coordinates, shuffled).
 */
export type FormationSamples = {
  /**
   * Number of Points.
   */
  readonly count: number;
  /**
   * Horizontal Positions.
   */
  readonly x: Float32Array;
  /**
   * Vertical Positions.
   */
  readonly y: Float32Array;
  /**
   * Pixel Colors as `r, g, b` Triples, or Null when Not Requested.
   */
  readonly rgb: Uint8ClampedArray | null;
};
