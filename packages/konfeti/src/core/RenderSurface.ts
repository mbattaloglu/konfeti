/**
 * Drawing Surface Contract.
 * What the engine, emitter and renderer need from a canvas — implemented by the DOM `CanvasSurface` and the
 * worker-side `OffscreenSurface`.
 */
export type RenderSurface = {
  /**
   * Return 2D Context.
   *
   * @returns 2D Context
   */
  getContext(): CanvasRenderingContext2D;
  /**
   * Return Canvas Pixels per CSS Pixel.
   *
   * @returns Pixel Ratio
   */
  getPixelRatio(): number;
  /**
   * Return CSS Width.
   *
   * @returns CSS Width
   */
  getWidth(): number;
  /**
   * Return CSS Height.
   *
   * @returns CSS Height
   */
  getHeight(): number;
  /**
   * Return Backing Store Width in Canvas Pixels.
   *
   * @returns Canvas Width
   */
  getBackingWidth(): number;
  /**
   * Return Backing Store Height in Canvas Pixels.
   *
   * @returns Canvas Height
   */
  getBackingHeight(): number;
  /**
   * Return Element Center in Canvas CSS Coordinates.
   *
   * @param element - DOM Element
   * @returns Center Point
   */
  getElementCenter(element: Element): { x: number; y: number };
  /**
   * Map Viewport Point into Canvas CSS Coordinates.
   *
   * @param clientX - Viewport X
   * @param clientY - Viewport Y
   * @returns Local Point
   */
  clientToLocal(clientX: number, clientY: number): { x: number; y: number };
  /**
   * Limit the Pixel Ratio (adaptive quality renders fewer pixels on slow devices).
   *
   * @param cap - Largest Pixel Ratio (`Infinity` removes the limit)
   */
  setPixelRatioCap(cap: number): void;
};
