import type { Particle } from "../../particles/Particle";
import { BaseShape } from "../abstracts/BaseShape";

/**
 * Vector Path Shape.
 * Draws star, triangle, polygon, heart, ribbon and custom SVG paths from cached unit paths.
 */
export class VectorShape extends BaseShape {
  /**
   * Singleton Instance.
   */
  private static instance: VectorShape | null = null;

  /**
   * Return Singleton Instance.
   *
   * @returns VectorShape Instance
   */
  public static getInstance(): VectorShape {
    VectorShape.instance ??= new VectorShape();
    return VectorShape.instance;
  }

  /**
   * Create Gradient in Path Space.
   *
   * @param context - 2D Context
   * @param particle - Spawned Particle (size and path set)
   * @param colors - CSS Color Stops
   * @param angle - Gradient Angle in Degrees
   * @returns Canvas Gradient
   */
  public override createGradient(
    context: CanvasRenderingContext2D,
    particle: Particle,
    colors: readonly string[],
    angle: number,
  ): CanvasGradient | null {
    const half = 0.5 / particle.pathScale;
    const aspect = particle.width > 0 ? particle.height / particle.width : 1;
    return BaseShape.buildGradient(
      context,
      -particle.pathOffsetX,
      -particle.pathOffsetY,
      half,
      half * aspect,
      colors,
      angle,
    );
  }

  /**
   * Paint Vector Path.
   *
   * @param context - Target 2D Context
   * @param particle - Particle
   * @param fill - Fill Style
   * @param withStroke - Stroke Allowed Flag
   */
  protected paint(
    context: CanvasRenderingContext2D,
    particle: Particle,
    fill: string | CanvasGradient,
    withStroke: boolean,
  ): void {
    const path = particle.path;

    if (path === null) {
      return;
    }

    const scale = particle.width * particle.pathScale;
    this.applyTransform(context, scale, particle.pathOffsetX, particle.pathOffsetY);
    context.fillStyle = fill;
    context.fill(path);

    if (withStroke && particle.strokeColor !== null && scale > 0) {
      context.strokeStyle = particle.strokeColor;
      // the path is drawn in unit space, so convert the CSS-pixel width back
      context.lineWidth = particle.strokeWidth / scale;
      context.stroke(path);
    }
  }
}
