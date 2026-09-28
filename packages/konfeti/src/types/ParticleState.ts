/**
 * Read-Only Particle Snapshot Passed to Hooks.
 * Positions are CSS pixels relative to the canvas, angles radians, times milliseconds.
 */
export type ParticleState = {
  /**
   * Horizontal Position.
   */
  readonly x: number;
  /**
   * Vertical Position.
   */
  readonly y: number;
  /**
   * Horizontal Velocity (px/s).
   */
  readonly vx: number;
  /**
   * Vertical Velocity (px/s).
   */
  readonly vy: number;
  /**
   * Current Age.
   */
  readonly age: number;
  /**
   * Total Lifetime.
   */
  readonly lifetime: number;
  /**
   * 2D Rotation in Radians.
   */
  readonly rotation: number;
  /**
   * Current Width.
   */
  readonly width: number;
  /**
   * Current Height.
   */
  readonly height: number;
  /**
   * Front Color (CSS string).
   */
  readonly frontColor: string;
};
