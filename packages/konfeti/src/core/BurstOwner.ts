/**
 * Burst Owner Contract.
 * Lets a burst ask its engine for a frame after `resume()` or `stop()`.
 */
export type BurstOwner = {
  /**
   * Request Animation Frame.
   */
  requestFrame(): void;
};
