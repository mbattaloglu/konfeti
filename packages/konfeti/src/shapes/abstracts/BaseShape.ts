import type { Particle } from "../../particles/Particle";
import { MathUtils } from "../../utils/MathUtils";
import type { IShape } from "./IShape";

/**
 * Abstract Particle Shape.
 * Handles everything shared by all shapes — fade in/out, scale over life, 3D flip, wobble, tilt, color over
 * life, shine — and leaves the silhouette to `paint()`. The base transform is computed once per draw into
 * reused fields, so drawing allocates nothing.
 */
export abstract class BaseShape implements IShape {
  /**
   * Second-Axis Flip Speed Ratio for `"both"` (golden ratio conjugate, avoids synced axes).
   */
  private static readonly BOTH_AXIS_RATIO = 0.618;

  /**
   * Shine Highlight Color.
   */
  private static readonly SHINE_COLOR = "#ffffff";

  /**
   * Shine Falloff Exponent (higher = shorter glint).
   */
  private static readonly SHINE_EXPONENT = 6;

  /**
   * Minimum Visible Shine Alpha.
   */
  private static readonly SHINE_THRESHOLD = 0.01;

  /**
   * Base Transform Component A.
   */
  private ma = 1;
  /**
   * Base Transform Component B.
   */
  private mb = 0;
  /**
   * Base Transform Component C.
   */
  private mc = 0;
  /**
   * Base Transform Component D.
   */
  private md = 1;
  /**
   * Base Transform Component E.
   */
  private me = 0;
  /**
   * Base Transform Component F.
   */
  private mf = 0;

  /**
   * Current Facing (`> 0` front, `< 0` back; magnitude = how flat the particle faces the viewer).
   */
  protected facing = 1;

  /**
   * Draw Particle.
   *
   * @param context - Target 2D Context
   * @param particle - Particle to Draw
   * @param pixelRatio - Canvas Pixels per CSS Pixel
   */
  public draw(context: CanvasRenderingContext2D, particle: Particle, pixelRatio: number): void {
    const progress = particle.getProgress();
    const alpha = BaseShape.computeAlpha(particle, progress);

    if (alpha <= 0) {
      return;
    }

    const lifeScale =
      particle.scaleEasing === null
        ? 1
        : MathUtils.lerp(
            1,
            particle.scaleEnd,
            MathUtils.clamp(particle.scaleEasing(progress), 0, 1),
          );

    if (lifeScale <= 0) {
      return;
    }

    this.computeMatrix(particle, pixelRatio, lifeScale);
    context.globalAlpha = alpha;
    this.paint(context, particle, this.pickFill(particle, progress), true);

    // shine is a flip glint, so flat (non-flipping) particles never get it
    if (
      particle.shine > 0 &&
      particle.flipAxis !== null &&
      this.facing > 0 &&
      this.supportsShine()
    ) {
      const glint = particle.shine * this.facing ** BaseShape.SHINE_EXPONENT;

      if (glint > BaseShape.SHINE_THRESHOLD) {
        context.globalAlpha = alpha * glint;
        this.paint(context, particle, BaseShape.SHINE_COLOR, false);
      }
    }
  }

  /**
   * Create Gradient Fill across the Particle Box.
   *
   * @param context - 2D Context
   * @param particle - Spawned Particle (size set)
   * @param colors - CSS Color Stops
   * @param angle - Gradient Angle in Degrees
   * @returns Canvas Gradient
   */
  public createGradient(
    context: CanvasRenderingContext2D,
    particle: Particle,
    colors: readonly string[],
    angle: number,
  ): CanvasGradient | null {
    return BaseShape.buildGradient(
      context,
      0,
      0,
      particle.width / 2,
      particle.height / 2,
      colors,
      angle,
    );
  }

  /**
   * Paint Silhouette.
   * Must call {@link BaseShape.applyTransform} before drawing.
   *
   * @param context - Target 2D Context
   * @param particle - Particle
   * @param fill - Fill Style
   * @param withStroke - Stroke Allowed Flag (false for the shine pass)
   */
  protected abstract paint(
    context: CanvasRenderingContext2D,
    particle: Particle,
    fill: string | CanvasGradient,
    withStroke: boolean,
  ): void;

  /**
   * Check Shine Support.
   *
   * @returns Shine Supported Flag
   */
  protected supportsShine(): boolean {
    return true;
  }

  /**
   * Apply Base Transform with Extra Local Scale and Offset.
   *
   * @param context - Target 2D Context
   * @param scale - Local Uniform Scale
   * @param offsetX - Local Horizontal Offset (before scaling)
   * @param offsetY - Local Vertical Offset (before scaling)
   */
  protected applyTransform(
    context: CanvasRenderingContext2D,
    scale: number,
    offsetX: number,
    offsetY: number,
  ): void {
    const a = this.ma * scale;
    const b = this.mb * scale;
    const c = this.mc * scale;
    const d = this.md * scale;
    context.setTransform(
      a,
      b,
      c,
      d,
      this.me + a * offsetX + c * offsetY,
      this.mf + b * offsetX + d * offsetY,
    );
  }

  /**
   * Build Linear Gradient across a Box.
   *
   * @param context - 2D Context
   * @param centerX - Box Center X
   * @param centerY - Box Center Y
   * @param halfWidth - Half Box Width
   * @param halfHeight - Half Box Height
   * @param colors - CSS Color Stops
   * @param angle - Gradient Angle in Degrees
   * @returns Canvas Gradient
   */
  protected static buildGradient(
    context: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    halfWidth: number,
    halfHeight: number,
    colors: readonly string[],
    angle: number,
  ): CanvasGradient {
    const radians = angle * MathUtils.DEG_TO_RAD;
    const dx = Math.cos(radians) * halfWidth;
    // canvas y grows downward, so 90° (bottom → top) is negative y
    const dy = -Math.sin(radians) * halfHeight;
    const gradient = context.createLinearGradient(
      centerX - dx,
      centerY - dy,
      centerX + dx,
      centerY + dy,
    );
    const last = Math.max(colors.length - 1, 1);

    colors.forEach((color, index) => {
      gradient.addColorStop(index / last, color);
    });

    return gradient;
  }

  /**
   * Calculate Current Opacity including Fade-In and Fade-Out.
   *
   * @param particle - Particle
   * @param progress - Life Progress (0–1)
   * @returns Opacity (0–1)
   */
  public static computeAlpha(particle: Particle, progress: number): number {
    let alpha = particle.opacity;

    if (particle.fadeIn > 0 && progress < particle.fadeIn) {
      alpha *= progress / particle.fadeIn;
    }

    const easing = particle.fadeEasing;

    if (easing !== null && progress > particle.fadeStart) {
      const fade = (progress - particle.fadeStart) / (1 - particle.fadeStart);
      alpha *= 1 - MathUtils.clamp(easing(MathUtils.clamp(fade, 0, 1)), 0, 1);
    }

    return alpha;
  }

  /**
   * Pick Fill for Current Side and Age.
   *
   * @param particle - Particle
   * @param progress - Life Progress (0–1)
   * @returns Fill Style
   */
  private pickFill(particle: Particle, progress: number): string | CanvasGradient {
    if (this.facing < 0) {
      return particle.backColor;
    }

    if (particle.gradient !== null) {
      return particle.gradient;
    }

    const table = particle.lifeColors;

    if (table !== null && particle.lifeColorEasing !== null) {
      const eased = MathUtils.clamp(particle.lifeColorEasing(progress), 0, 1);
      return table[Math.round(eased * (table.length - 1))] ?? particle.frontColor;
    }

    return particle.frontColor;
  }

  /**
   * Compute Base Transform (rotate · flip · skew · life scale, pre-multiplied by pixel ratio).
   *
   * @param particle - Particle
   * @param pixelRatio - Canvas Pixels per CSS Pixel
   * @param lifeScale - Scale-over-Life Multiplier
   */
  private computeMatrix(particle: Particle, pixelRatio: number, lifeScale: number): void {
    let flipX = 1;
    let flipY = 1;

    switch (particle.flipAxis) {
      case "x":
        flipY = Math.cos(particle.flipPhase);
        break;
      case "y":
        flipX = Math.cos(particle.flipPhase);
        break;
      case "both":
        flipX = Math.cos(particle.flipPhase);
        flipY = Math.cos(particle.flipPhase * BaseShape.BOTH_AXIS_RATIO);
        break;
      case null:
        break;
    }

    this.facing = flipX * flipY;

    const skew =
      particle.tilt === 0
        ? particle.skewTan
        : particle.skewTan + particle.tilt * Math.cos(particle.wobblePhase);
    const cos = Math.cos(particle.rotation);
    const sin = Math.sin(particle.rotation);
    const sx = flipX * lifeScale * pixelRatio;
    const sy = flipY * lifeScale * pixelRatio;

    this.ma = cos * sx;
    this.mb = sin * sx;
    this.mc = cos * sx * skew - sin * sy;
    this.md = sin * sx * skew + cos * sy;
    this.me = particle.getDrawX() * pixelRatio;
    this.mf = particle.y * pixelRatio;
  }
}
