import type { ScratchCanvas } from "../types/resolved/ScratchCanvas";

/**
 * Static Scratch-Canvas Factory.
 * Creates a DOM canvas on the main thread; environments without a DOM (workers) install their own creator,
 * so rasterizing and color parsing work in both places.
 */
export class CanvasFactory {
  /**
   * Creator Used without the DOM (installed by the worker entry), or Null.
   */
  private static fallback: ((width: number, height: number) => ScratchCanvas | null) | null = null;

  /**
   * Create Scratch Canvas with 2D Context.
   *
   * @param width - Canvas Width in Pixels
   * @param height - Canvas Height in Pixels
   * @returns Canvas and Context, or Null without any canvas implementation
   */
  public static create(width: number, height: number): ScratchCanvas | null {
    if (typeof document === "undefined") {
      return CanvasFactory.fallback?.(width, height) ?? null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    return context === null ? null : { canvas, context };
  }

  /**
   * Install Creator for Environments without the DOM (workers).
   * Kept out of the main bundle, so only the worker script pays for it.
   *
   * @param create - Creator Returning a Scratch Canvas or Null
   */
  public static setFallback(create: (width: number, height: number) => ScratchCanvas | null): void {
    CanvasFactory.fallback = create;
  }
}
