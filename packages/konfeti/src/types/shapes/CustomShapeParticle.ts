/**
 * Particle View Passed to a Custom `draw()` Function.
 * The context is already translated, rotated, flipped, skewed, scaled and faded; draw centered at `0, 0`
 * inside a `width × height` box. The object is reused between calls — read it, don't keep it.
 */
export type CustomShapeParticle = {
  /**
   * Box Width in Local Pixels.
   */
  readonly width: number;
  /**
   * Box Height in Local Pixels.
   */
  readonly height: number;
  /**
   * Fill Style for the Current Side and Age (color, gradient or back color).
   */
  readonly fill: string | CanvasGradient;
  /**
   * Stroke Color (`null` when stroke is off).
   */
  readonly stroke: string | null;
  /**
   * Stroke Width in Local Pixels.
   */
  readonly strokeWidth: number;
  /**
   * Life Progress (`0` = just spawned, `1` = about to die).
   */
  readonly progress: number;
  /**
   * Facing (`> 0` front side, `< 0` back side while flipping).
   */
  readonly facing: number;
};
