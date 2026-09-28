import type { Particle } from "../../particles/Particle";
import { MathUtils } from "../../utils/MathUtils";
import { BaseShape } from "../abstracts/BaseShape";

/**
 * Default Paper Confetti Shape.
 * Draws rect / square / circle / strip / leaf silhouettes.
 */
export class PaperShape extends BaseShape {
  /**
   * Singleton Instance.
   */
  private static instance: PaperShape | null = null;

  /**
   * Return Singleton Instance.
   *
   * @returns PaperShape Instance
   */
  public static getInstance(): PaperShape {
    PaperShape.instance ??= new PaperShape();
    return PaperShape.instance;
  }

  /**
   * Paint Paper Silhouette.
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
    const halfWidth = particle.width / 2;
    const halfHeight = particle.height / 2;
    const strokeColor = withStroke ? particle.strokeColor : null;

    this.applyTransform(context, 1, 0, 0);
    context.fillStyle = fill;

    if (strokeColor !== null) {
      context.strokeStyle = strokeColor;
      context.lineWidth = particle.strokeWidth;
    }

    if (particle.form === "circle") {
      context.beginPath();
      context.ellipse(0, 0, halfWidth, halfHeight, 0, 0, MathUtils.TAU);
    } else if (particle.isRounded) {
      context.beginPath();
      PaperShape.traceRoundedRect(
        context,
        -halfWidth,
        -halfHeight,
        particle.width,
        particle.height,
        particle.radii,
      );
    } else {
      // sharp rectangles skip path building entirely
      context.fillRect(-halfWidth, -halfHeight, particle.width, particle.height);

      if (strokeColor !== null) {
        context.strokeRect(-halfWidth, -halfHeight, particle.width, particle.height);
      }

      return;
    }

    context.fill();

    if (strokeColor !== null) {
      context.stroke();
    }
  }

  /**
   * Trace Rounded Rectangle Path.
   * Uses native `roundRect` when available, otherwise an `arcTo` fallback.
   *
   * @param context - Target 2D Context
   * @param x - Left Edge
   * @param y - Top Edge
   * @param width - Width
   * @param height - Height
   * @param radii - Corner Radius List (`tl, tr, br, bl`)
   */
  private static traceRoundedRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radii: readonly [number, number, number, number],
  ): void {
    // roundRect is missing in older Safari/Firefox, so the typed optional view is intentional
    const native: Partial<Pick<CanvasRenderingContext2D, "roundRect">> = context;

    if (typeof native.roundRect === "function") {
      context.roundRect(x, y, width, height, radii);
      return;
    }

    const limit = Math.min(width, height) / 2;
    const [tl, tr, br, bl] = radii;

    context.moveTo(x + Math.min(tl, limit), y);
    context.arcTo(x + width, y, x + width, y + height, Math.min(tr, limit));
    context.arcTo(x + width, y + height, x, y + height, Math.min(br, limit));
    context.arcTo(x, y + height, x, y, Math.min(bl, limit));
    context.arcTo(x, y, x + width, y, Math.min(tl, limit));
    context.closePath();
  }
}
