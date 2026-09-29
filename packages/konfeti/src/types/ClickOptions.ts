import type { KonfetiHandle } from "./KonfetiHandle";

/**
 * Click Listener Settings (third argument of `onClick`).
 *
 * @example
 * ```ts
 * // fire on press, and keep each burst's handle
 * Konfeti.onClick(button, { particleCount: 30 }, {
 *   trigger: "pointerdown",
 *   onFire: (burst) => burst.then(() => console.log("done")),
 * });
 * ```
 */
export type ClickOptions = {
  /**
   * Trigger Event.
   * `"click"` fires when a click completes. `"pointerdown"` fires as soon as the mouse button, finger or pen
   * goes down: it feels snappier and keeps working when the page cancels touch events (common in games and
   * playable ads, where `preventDefault()` on touch suppresses `click`).
   *
   * @defaultValue `"click"`
   */
  readonly trigger?: "click" | "pointerdown";
  /**
   * Burst Callback.
   * Called with the handle of every burst the listener fires, and the event that fired it. Use it to pause,
   * stop or `await` click bursts, which `onClick` itself cannot return.
   *
   * @defaultValue none
   */
  readonly onFire?: (handle: KonfetiHandle, event: MouseEvent) => void;
};
