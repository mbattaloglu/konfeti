import type { Particle } from "../../particles/Particle";
import { BaseShape } from "../abstracts/BaseShape";

/**
 * Animated Spritesheet Shape.
 * Draws the particle's current frame straight from the sheet with a source rectangle.
 */
export class SpriteShape extends BaseShape {
  /**
   * Singleton Instance.
   */
  private static instance: SpriteShape | null = null;

  /**
   * Return Singleton Instance.
   *
   * @returns SpriteShape Instance
   */
  public static getInstance(): SpriteShape {
    SpriteShape.instance ??= new SpriteShape();
    return SpriteShape.instance;
  }

  /**
   * Refuse Gradients (sprites keep their own pixels).
   *
   * @returns Null
   */
  public override createGradient(): CanvasGradient | null {
    return null;
  }

  /**
   * Disable Shine for Sprites.
   *
   * @returns False
   */
  protected override supportsShine(): boolean {
    return false;
  }

  /**
   * Paint Current Frame.
   *
   * @param context - Target 2D Context
   * @param particle - Particle
   */
  protected paint(context: CanvasRenderingContext2D, particle: Particle): void {
    const image = particle.image;
    const frames = particle.frames;

    if (image === null || frames === null || !image.isReady()) {
      return;
    }

    let sx: number;
    let sy: number;
    let sw: number;
    let sh: number;

    if (frames.kind === "grid") {
      sw = image.getWidth() / frames.cols;
      sh = image.getHeight() / frames.rows;
      sx = (particle.frameIndex % frames.cols) * sw;
      sy = Math.floor(particle.frameIndex / frames.cols) * sh;
    } else {
      const rect = frames.rects[particle.frameIndex] ?? frames.rects[0];

      if (rect === undefined) {
        return;
      }

      sx = rect.x;
      sy = rect.y;
      sw = rect.width;
      sh = rect.height;
    }

    particle.height = sw > 0 ? (particle.width * sh) / sw : particle.width;
    this.applyTransform(context, 1, 0, 0);
    context.drawImage(
      image.getImage(),
      sx,
      sy,
      sw,
      sh,
      -particle.width / 2,
      -particle.height / 2,
      particle.width,
      particle.height,
    );
  }
}
