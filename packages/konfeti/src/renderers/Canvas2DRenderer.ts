import type { Burst } from "../core/Burst";
import type { RenderSurface } from "../core/RenderSurface";
import { TrailPainter } from "./TrailPainter";

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
   * Draw Shadows, Shine and Trails Flag (off at reduced adaptive quality).
   */
  private _hasEffects = true;

  /**
   * Switch Shadows, Shine and Trails On or Off.
   *
   * @param enabled - Effects Flag
   */
  public setEffects(enabled: boolean): void {
    this._hasEffects = enabled;
  }

  /**
   * Render All Bursts.
   *
   * @param surface - Target Surface
   * @param bursts - Bursts to Draw (oldest first)
   */
  public render(surface: RenderSurface, bursts: readonly Burst[]): void {
    const context = surface.getContext();
    const pixelRatio = surface.getPixelRatio();
    const effects = this._hasEffects;
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

        const particleShadow = effects ? particle.shadowColor : null;
        const particleBlur = effects ? particle.shadowBlur : 0;

        if (particleShadow !== shadowColor || particleBlur !== shadowBlur) {
          shadowColor = particleShadow;
          shadowBlur = particleBlur;
          // shadow values are in device pixels and ignore the transform
          context.shadowColor = shadowColor ?? Canvas2DRenderer.NO_SHADOW;
          context.shadowBlur = shadowBlur * pixelRatio;
          context.shadowOffsetX = particle.shadowOffsetX * pixelRatio;
          context.shadowOffsetY = particle.shadowOffsetY * pixelRatio;
        }

        if (effects && particle.trailCount > 1) {
          // a shadow would blur every trail segment again on every frame (a shadowed sparkler fell to 1 fps)
          if (shadowColor !== null) {
            context.shadowColor = Canvas2DRenderer.NO_SHADOW;
          }

          TrailPainter.draw(context, particle, pixelRatio);

          if (shadowColor !== null) {
            context.shadowColor = shadowColor;
          }
        }

        particle.shape?.draw(context, particle, pixelRatio, effects);
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
