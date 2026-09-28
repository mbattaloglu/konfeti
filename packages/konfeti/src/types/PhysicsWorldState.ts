/**
 * Read-Only Simulation Bounds Passed to Custom Physics.
 */
export type PhysicsWorldState = {
  /**
   * Canvas Width in CSS Pixels.
   */
  readonly width: number;
  /**
   * Canvas Height in CSS Pixels.
   */
  readonly height: number;
};
