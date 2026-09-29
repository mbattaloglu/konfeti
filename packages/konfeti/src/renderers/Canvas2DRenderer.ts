import type { Burst } from "../core/Burst";
import type { RenderSurface } from "../core/RenderSurface";

/**
 * Canvas 2D Renderer.
 * Clears the surface and asks each particle's shape to draw itself. Blend mode and shadow state only change
 * when consecutive particles differ.
 */
export class Canvas2DRenderer {
  /**
   * Default Blend Mode.
   */
  private static readonly DEFAULT_BLEND_MODE: GlobalCompositeOperation = "source-over";

  /**
   * Shadow-Off Color.
   */
  private static readonly NO_SHADOW = "transparent";

  /**
   * Render All Bursts.
   *
   * @param surface - Target Surface
   * @param bursts - Bursts to Draw (oldest first)
   */
  public render(surface: RenderSurface, bursts: readonly Burst[]): void {
    const context = surface.getContext();
    const pixelRatio = surface.getPixelRatio();
    let blendMode = Canvas2DRenderer.DEFAULT_BLEND_MODE;
    let shadowColor: string | null = null;
    let shadowBlur = 0;

    this.clear(surface);
    context.globalCompositeOperation = blendMode;

    for (const burst of bursts) {
      for (const particle of burst.getParticles()) {
        if (particle.blendMode !== blendMode) {
          blendMode = particle.blendMode;
          context.globalCompositeOperation = blendMode;
        }

        if (particle.shadowColor !== shadowColor || particle.shadowBlur !== shadowBlur) {
          shadowColor = particle.shadowColor;
          shadowBlur = particle.shadowBlur;
          // shadow values are in device pixels and ignore the transform
          context.shadowColor = shadowColor ?? Canvas2DRenderer.NO_SHADOW;
          context.shadowBlur = shadowBlur * pixelRatio;
          context.shadowOffsetX = particle.shadowOffsetX * pixelRatio;
          context.shadowOffsetY = particle.shadowOffsetY * pixelRatio;
        }

        particle.shape?.draw(context, particle, pixelRatio);
      }
    }

    this.resetState(surface);
  }

  /**
   * Clear Surface.
   *
   * @param surface - Target Surface
   */
  public clear(surface: RenderSurface): void {
    const context = surface.getContext();

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, surface.getBackingWidth(), surface.getBackingHeight());
  }

  /**
   * Restore Neutral Context State.
   *
   * @param surface - Target Surface
   */
  private resetState(surface: RenderSurface): void {
    const context = surface.getContext();

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.globalCompositeOperation = Canvas2DRenderer.DEFAULT_BLEND_MODE;
    context.shadowColor = Canvas2DRenderer.NO_SHADOW;
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
  }
}
