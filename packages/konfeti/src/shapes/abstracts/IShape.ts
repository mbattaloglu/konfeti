import type { Particle } from "../../particles/Particle";

/**
 * Particle Shape Contract.
 * A shape draws one particle without allocating. The renderer owns blend mode and shadow state; shapes may
 * change `globalAlpha`, fill/stroke styles, `lineWidth` and the transform.
 */
export type IShape = {
  /**
   * Draw Particle.
   *
   * @param context - Target 2D Context
   * @param particle - Particle to Draw
   * @param pixelRatio - Canvas Pixels per CSS Pixel
   * @param detail - Draw Extra Detail such as Shine (off at reduced adaptive quality)
   */
  draw(
    context: CanvasRenderingContext2D,
    particle: Particle,
    pixelRatio: number,
    detail?: boolean,
  ): void;

  /**
   * Create Gradient Fill in the Shape's Local Space.
   *
   * @param context - 2D Context
   * @param particle - Spawned Particle (size set)
   * @param colors - CSS Color Stops
   * @param angle - Gradient Angle in Degrees
   * @returns Canvas Gradient or Null when the shape does not support gradients
   */
  createGradient(
    context: CanvasRenderingContext2D,
    particle: Particle,
    colors: readonly string[],
    angle: number,
  ): CanvasGradient | null;
};
