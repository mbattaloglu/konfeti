import type { Particle } from "../particles/Particle";
import { BaseShape } from "../shapes/abstracts/BaseShape";

/**
 * Static Trail Painter.
 * Strokes a particle's recorded positions oldest to newest; every segment is thinner and more transparent
 * toward the tail. Drawn before the particle itself, in CSS pixels.
 */
export class TrailPainter {
  /**
   * Draw a Particle's Trail (no-op with fewer than two points).
   *
   * @param context - 2D Context
   * @param particle - Particle
   * @param pixelRatio - Device Pixel Ratio
   */
  public static draw(
    context: CanvasRenderingContext2D,
    particle: Particle,
    pixelRatio: number,
  ): void {
    const count = particle.trailCount;
    const xs = particle.trailX;
    const ys = particle.trailY;

    if (count < 2 || xs === null || ys === null) {
      return;
    }

    // the trail fades with its particle
    const alpha = BaseShape.computeAlpha(particle, particle.getProgress()) * particle.trailOpacity;

    if (alpha <= 0) {
      return;
    }

    const length = particle.trailLength;
    const oldest = (particle.trailHead - count + length) % length;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.strokeStyle = particle.trailColor ?? particle.frontColor;
    // butt caps: round caps overlap at every joint and double the alpha there (a beaded look)
    context.lineCap = "butt";

    for (let index = 1; index < count; index++) {
      const from = (oldest + index - 1) % length;
      const to = (oldest + index) % length;
      // 0 at the tail, 1 right behind the particle
      const weight = index / (count - 1);

      context.globalAlpha = alpha * weight;
      context.lineWidth = particle.trailWidth * weight;
      context.beginPath();
      context.moveTo(xs[from] ?? 0, ys[from] ?? 0);
      context.lineTo(xs[to] ?? 0, ys[to] ?? 0);
      context.stroke();
    }
  }
}
