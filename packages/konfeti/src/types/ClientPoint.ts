/**
 * Viewport Point.
 * Any object with `clientX` / `clientY` — a `MouseEvent`, `PointerEvent` or `Touch` works directly.
 *
 * @example
 * ```ts
 * button.addEventListener("click", (event) => Konfeti.fire({ origin: event }));
 * ```
 */
export type ClientPoint = {
  /**
   * Horizontal Viewport Coordinate.
   */
  readonly clientX: number;
  /**
   * Vertical Viewport Coordinate.
   */
  readonly clientY: number;
};
