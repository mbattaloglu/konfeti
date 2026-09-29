/**
 * Static Fullscreen Overlay Canvas Helpers.
 * Shared by the main-thread surface and the worker instance host.
 */
export class OverlayCanvas {
  /**
   * Overlay Canvas Inline Style.
   */
  private static readonly STYLE =
    "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;";

  /**
   * Create Overlay Canvas (not yet attached).
   *
   * @param zIndex - Overlay z-index
   * @returns Canvas Element
   */
  public static create(zIndex: number): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.style.cssText = `${OverlayCanvas.STYLE}z-index:${String(zIndex)};`;
    canvas.setAttribute("aria-hidden", "true");
    return canvas;
  }

  /**
   * Attach Overlay to the Page if Needed.
   *
   * @param canvas - Overlay Canvas
   */
  public static mount(canvas: HTMLCanvasElement): void {
    if (!canvas.isConnected) {
      document.body.appendChild(canvas);
    }
  }
}
