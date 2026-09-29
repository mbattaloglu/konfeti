/**
 * Scratch Canvas with Its 2D Context (DOM canvas on the main thread, `OffscreenCanvas` in workers).
 */
export type ScratchCanvas = {
  /**
   * Canvas Element or Offscreen Canvas.
   */
  readonly canvas: HTMLCanvasElement | OffscreenCanvas;
  /**
   * 2D Context of the Canvas.
   */
  readonly context: CanvasRenderingContext2D;
};
