import type { Particle } from "../../particles/Particle";
import type { CustomShapeParticle } from "../../types/shapes/CustomShapeParticle";
import { BaseShape } from "../abstracts/BaseShape";

/**
 * Mutable View Reused for Every Custom Draw Call.
 */
type MutableView = {
  -readonly [K in keyof CustomShapeParticle]: CustomShapeParticle[K];
};

/**
 * Draw-Based Custom Shape Renderer.
 * Applies the shared transform and hands a reused particle view to the user's `draw()`.
 */
export class CustomShape extends BaseShape {
  /**
   * Singleton Instance.
   */
  private static instance: CustomShape | null = null;

  /**
   * Reused Particle View.
   */
  private readonly view: MutableView = {
    width: 0,
    height: 0,
    fill: "",
    stroke: null,
    strokeWidth: 0,
    progress: 0,
    facing: 1,
  };

  /**
   * Return Singleton Instance.
   *
   * @returns CustomShape Instance
   */
  public static getInstance(): CustomShape {
    CustomShape.instance ??= new CustomShape();
    return CustomShape.instance;
  }

  /**
   * Paint via User Draw Function.
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
    const custom = particle.custom;

    if (custom === null) {
      return;
    }

    const view = this.view;
    view.width = particle.width;
    view.height = particle.height;
    view.fill = fill;
    view.stroke = withStroke ? particle.strokeColor : null;
    view.strokeWidth = particle.strokeWidth;
    view.progress = particle.getProgress();
    view.facing = this.facing;

    this.applyTransform(context, 1, 0, 0);
    context.fillStyle = fill;
    custom.draw(context, view, custom.options);
  }
}
