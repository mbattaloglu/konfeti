import type { FireOptions } from "./FireOptions";
import type { FrameScheduler } from "./FrameScheduler";

/**
 * Options for a Konfeti Instance.
 *
 * @example
 * ```ts
 * const konfeti = KonfetiFactory.create(myCanvas, {
 *   maxParticles: 800,
 *   defaults: { paper: { colors: ["gold", "white"] } },
 * });
 * ```
 */
export type CreateOptions = {
  /**
   * Automatic Canvas Resize.
   * Keeps the canvas' pixel size in sync with its CSS size (and the window, for the built-in overlay canvas).
   * Disable if you manage the canvas size yourself.
   *
   * @defaultValue `true`
   */
  readonly resize?: boolean;
  /**
   * Overlay Canvas z-index.
   * Only used by the built-in fullscreen canvas (when no canvas is passed to `KonfetiFactory.create()`).
   *
   * @defaultValue `100`
   */
  readonly zIndex?: number;
  /**
   * Maximum Live Particles.
   * When a new burst would exceed it, the oldest particles are removed first.
   *
   * @defaultValue `1500`
   */
  readonly maxParticles?: number;
  /**
   * Device Pixel Ratio Cap.
   * Limits canvas resolution on very dense screens to save GPU time. `1` renders at CSS resolution.
   *
   * @defaultValue `2`
   */
  readonly maxDevicePixelRatio?: number;
  /**
   * Respect Reduced Motion.
   * When `true` and the user has `prefers-reduced-motion: reduce`, `fire()` draws nothing and its handle
   * resolves immediately.
   *
   * @defaultValue `false`
   */
  readonly disableForReducedMotion?: boolean;
  /**
   * Instance Default Burst Options.
   * Merged under every `fire()` call on this instance (fire options win). Nested groups such as `paper` and
   * `physics` are merged key by key.
   *
   * @defaultValue `{}`
   */
  readonly defaults?: FireOptions;
  /**
   * Custom Frame Scheduler.
   * Replaces `requestAnimationFrame`. Intended for tests and custom render loops.
   *
   * @defaultValue `window.requestAnimationFrame`
   */
  readonly frameScheduler?: FrameScheduler;
};
