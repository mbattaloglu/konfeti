import type { Particle } from "../../particles/Particle";
import { BaseShape } from "../abstracts/BaseShape";

/**
 * Bitmap Shape.
 * Draws emoji, text and image particles from cached bitmaps. The aspect ratio is taken from the image, so
 * URL images can finish loading after the particle spawned.
 */
export class BitmapShape extends BaseShape {
  /**
   * Singleton Instance.
   */
  private static instance: BitmapShape | null = null;

  /**
   * Return Singleton Instance.
   *
   * @returns BitmapShape Instance
   */
  public static getInstance(): BitmapShape {
    BitmapShape.instance ??= new BitmapShape();
    return BitmapShape.instance;
  }

  /**
   * Refuse Gradients (bitmaps keep their own pixels).
   *
   * @returns Null
   */
  public override createGradient(): CanvasGradient | null {
    return null;
  }

  /**
   * Disable Shine for Bitmaps.
   *
   * @returns False
   */
  protected override supportsShine(): boolean {
    return false;
  }

  /**
   * Paint Bitmap.
   *
   * @param context - Target 2D Context
   * @param particle - Particle
   */
  protected paint(context: CanvasRenderingContext2D, particle: Particle): void {
    const image = particle.image;

    if (!image?.isReady()) {
      return;
    }

    if (particle.height === 0) {
      particle.height = (particle.width * image.getHeight()) / image.getWidth();
    }

    this.applyTransform(context, 1, 0, 0);
    context.drawImage(
      image.getImage(),
      -particle.width / 2,
      -particle.height / 2,
      particle.width,
      particle.height,
    );
  }
}
