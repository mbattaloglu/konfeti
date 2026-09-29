import type { RenderSurface } from "../core/RenderSurface";

/**
 * Canvas the Worker Draws Into (an `OffscreenCanvas`, or any canvas-like object in tests).
 */
export type OffscreenCanvasLike = {
  /**
   * Backing Store Width.
   */
  width: number;
  /**
   * Backing Store Height.
   */
  height: number;
  /**
   * Return 2D Context.
   */
  getContext(contextId: "2d"): unknown;
};

/**
 * Worker-Side Drawing Surface.
 * Sizes come from the main thread (which owns the DOM); element and viewport origins are converted to
 * normalized points before they reach the worker.
 */
export class OffscreenSurface implements RenderSurface {
  /**
   * Target Canvas.
   */
  private readonly canvas: OffscreenCanvasLike;

  /**
   * 2D Context.
   */
  private readonly context: CanvasRenderingContext2D;

  /**
   * CSS Width.
   */
  private width = 0;

  /**
   * CSS Height.
   */
  private height = 0;

  /**
   * Canvas Pixels per CSS Pixel.
   */
  private pixelRatio = 1;

  /**
   * Create Surface.
   *
   * @param canvas - Offscreen Canvas
   * @throws Error when a 2D context is unavailable
   */
  public constructor(canvas: OffscreenCanvasLike) {
    const context = canvas.getContext("2d");

    if (context === null || context === undefined) {
      throw new Error("konfeti: 2D context is not available in the worker");
    }

    this.canvas = canvas;
    // the offscreen context implements every 2D call the renderer makes
    this.context = context as CanvasRenderingContext2D;
  }

  /**
   * Apply Size Measured on the Main Thread.
   *
   * @param width - CSS Width
   * @param height - CSS Height
   * @param pixelRatio - Canvas Pixels per CSS Pixel
   */
  public resize(width: number, height: number, pixelRatio: number): void {
    this.width = width;
    this.height = height;
    this.pixelRatio = pixelRatio;
    this.canvas.width = Math.round(width * pixelRatio);
    this.canvas.height = Math.round(height * pixelRatio);
  }

  /**
   * Return 2D Context.
   *
   * @returns 2D Context
   */
  public getContext(): CanvasRenderingContext2D {
    return this.context;
  }

  /**
   * Return Pixel Ratio.
   *
   * @returns Canvas Pixels per CSS Pixel
   */
  public getPixelRatio(): number {
    return this.pixelRatio;
  }

  /**
   * Return CSS Width.
   *
   * @returns CSS Width
   */
  public getWidth(): number {
    return this.width;
  }

  /**
   * Return CSS Height.
   *
   * @returns CSS Height
   */
  public getHeight(): number {
    return this.height;
  }

  /**
   * Return Backing Store Width.
   *
   * @returns Canvas Width
   */
  public getBackingWidth(): number {
    return this.canvas.width;
  }

  /**
   * Return Backing Store Height.
   *
   * @returns Canvas Height
   */
  public getBackingHeight(): number {
    return this.canvas.height;
  }

  /**
   * Reject Element Origins (converted on the main thread).
   *
   * @returns Never
   * @throws Error always
   */
  public getElementCenter(): { x: number; y: number } {
    throw new Error("konfeti: element origins are measured on the main thread");
  }

  /**
   * Reject Viewport Origins (converted on the main thread).
   *
   * @returns Never
   * @throws Error always
   */
  public clientToLocal(): { x: number; y: number } {
    throw new Error("konfeti: viewport origins are measured on the main thread");
  }
}
