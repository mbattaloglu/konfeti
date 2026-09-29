import type { ScratchCanvas } from "../types/resolved/ScratchCanvas";

/**
 * Static Offscreen Scratch-Canvas Creator for Workers.
 */
export class OffscreenScratch {
  /**
   * Create Offscreen Scratch Canvas with 2D Context.
   *
   * @param width - Canvas Width in Pixels
   * @param height - Canvas Height in Pixels
   * @returns Canvas and Context, or Null without `OffscreenCanvas` / a 2D context
   */
  public static create(width: number, height: number): ScratchCanvas | null {
    if (typeof OffscreenCanvas === "undefined") {
      return null;
    }

    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d");
    // the offscreen context implements every 2D call the library makes (text, paths, images)
    return context === null
      ? null
      : { canvas, context: context as unknown as CanvasRenderingContext2D };
  }
}
