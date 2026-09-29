import type { ResolvedCreateOptions } from "../types/resolved/ResolvedCreateOptions";
import { EnvUtils } from "../utils/EnvUtils";
import { OverlayCanvas } from "./OverlayCanvas";
import type { RenderSurface } from "./RenderSurface";

/**
 * Canvas Surface.
 * Owns the canvas element and 2D context, keeps pixel size in sync with CSS size and maps DOM positions
 * into canvas coordinates.
 */
export class CanvasSurface implements RenderSurface {
  /**
   * Canvas Element.
   */
  private readonly canvas: HTMLCanvasElement;

  /**
   * 2D Rendering Context.
   */
  private readonly context: CanvasRenderingContext2D;

  /**
   * Resolved Instance Options.
   */
  private readonly options: ResolvedCreateOptions;

  /**
   * Owned Overlay Canvas Flag.
   */
  private readonly _isOwned: boolean;

  /**
   * Mounted State Flag.
   */
  private _isMounted = false;

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
   * Resize Observer (user canvases only).
   */
  private resizeObserver: ResizeObserver | null = null;

  /**
   * Create Surface.
   *
   * @param canvas - User Canvas (`null` creates a fullscreen overlay)
   * @param options - Resolved Instance Options
   * @throws Error when a 2D context is unavailable
   */
  public constructor(canvas: HTMLCanvasElement | null, options: ResolvedCreateOptions) {
    this.options = options;
    this._isOwned = canvas === null;
    this.canvas = canvas ?? OverlayCanvas.create(options.zIndex);

    const context = this.canvas.getContext("2d");

    if (context === null) {
      throw new Error("konfeti: 2D canvas context is not available");
    }

    this.context = context;
  }

  /**
   * Mount Overlay and Start Size Tracking.
   * Idempotent; called lazily on the first `fire()`.
   */
  public mount(): void {
    if (this._isMounted) {
      return;
    }

    if (this._isOwned) {
      OverlayCanvas.mount(this.canvas);
    }

    this._isMounted = true;
    this.measure();
    this.registerResizeEvents();
  }

  /**
   * Update Size from Layout.
   */
  public measure(): void {
    if (this._isOwned) {
      this.pixelRatio = EnvUtils.getDevicePixelRatio(this.options.maxDevicePixelRatio);
      this.width = window.innerWidth;
      this.height = window.innerHeight;
    } else if (this.options.resize) {
      this.pixelRatio = EnvUtils.getDevicePixelRatio(this.options.maxDevicePixelRatio);
      this.width = this.canvas.clientWidth || this.canvas.width / this.pixelRatio;
      this.height = this.canvas.clientHeight || this.canvas.height / this.pixelRatio;
    } else {
      // user-managed size: keep the backing store and derive the ratio from it
      this.width = this.canvas.clientWidth || this.canvas.width;
      this.height = this.canvas.clientHeight || this.canvas.height;
      this.pixelRatio = this.width > 0 ? this.canvas.width / this.width : 1;
      return;
    }

    this.canvas.width = Math.round(this.width * this.pixelRatio);
    this.canvas.height = Math.round(this.height * this.pixelRatio);
  }

  /**
   * Return Element Center in Canvas CSS Coordinates.
   *
   * @param element - DOM Element
   * @returns Center Point
   */
  public getElementCenter(element: Element): { x: number; y: number } {
    const target = element.getBoundingClientRect();
    const bounds = this._isOwned ? { left: 0, top: 0 } : this.canvas.getBoundingClientRect();

    return {
      x: target.left + target.width / 2 - bounds.left,
      y: target.top + target.height / 2 - bounds.top,
    };
  }

  /**
   * Map Viewport Point into Canvas CSS Coordinates.
   *
   * @param clientX - Viewport X
   * @param clientY - Viewport Y
   * @returns Local Point
   */
  public clientToLocal(clientX: number, clientY: number): { x: number; y: number } {
    const bounds = this._isOwned ? { left: 0, top: 0 } : this.canvas.getBoundingClientRect();
    return { x: clientX - bounds.left, y: clientY - bounds.top };
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
   * Return Canvas Element.
   *
   * @returns Canvas Element
   */
  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Return Backing Store Width in Canvas Pixels.
   *
   * @returns Canvas Width
   */
  public getBackingWidth(): number {
    return this.canvas.width;
  }

  /**
   * Return Backing Store Height in Canvas Pixels.
   *
   * @returns Canvas Height
   */
  public getBackingHeight(): number {
    return this.canvas.height;
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
   * Return Pixel Ratio.
   *
   * @returns Canvas Pixels per CSS Pixel
   */
  public getPixelRatio(): number {
    return this.pixelRatio;
  }

  /**
   * Stop Size Tracking and Remove Owned Canvas.
   */
  public destroy(): void {
    this.unregisterResizeEvents();

    if (this._isOwned) {
      this.canvas.remove();
    }

    this._isMounted = false;
  }

  /**
   * Register Resize Listeners.
   */
  private registerResizeEvents(): void {
    if (!this.options.resize) {
      return;
    }

    if (this._isOwned || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", this.onResize);
      return;
    }

    this.resizeObserver = new ResizeObserver(this.onResize);
    this.resizeObserver.observe(this.canvas);
  }

  /**
   * Unregister Resize Listeners.
   */
  private unregisterResizeEvents(): void {
    window.removeEventListener("resize", this.onResize);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  /**
   * Handle Resize.
   */
  private readonly onResize = (): void => {
    this.measure();
  };
}
