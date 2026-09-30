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
   * Fixed Time Step.
   * Simulate in fixed 1/60 s steps instead of the real frame time. A burst fired again with the same `seed`
   * (and the same options and canvas size) then replays exactly, particle for particle, on any display and at
   * any frame rate. Motion updates 60 times per second, also on faster screens.
   *
   * @defaultValue `false` (each frame simulates the real time since the last one)
   * @example
   * ```ts
   * const stage = KonfetiFactory.create(canvas, { fixedTimestep: true });
   * const seed = stage.fire().getSeed();
   * stage.fire({ seed }); // exactly the same burst again
   * ```
   * @remarks Useful for replays, demos and visual tests. Without it, the same seed still gives the same
   * particles, but their paths can differ slightly with the frame timing.
   */
  readonly fixedTimestep?: boolean;
  /**
   * Adaptive Quality.
   * Watches the frame rate while particles animate. When frames stay slow (below about 50 fps) and konfeti's
   * own drawing is a real part of the cost, the quality steps down one level at a time: `1` renders at CSS
   * resolution, `2` also drops shadows, shine and trails, `3` also spawns 60% of the requested particles.
   * After a few seconds of smooth frames it steps back up.
   *
   * @defaultValue `false` (always full quality)
   * @example
   * ```ts
   * const stage = KonfetiFactory.create(null, { adaptiveQuality: true }); // fullscreen, like Konfeti
   * stage.fire(KonfetiPresets.FIREWORKS);
   * stage.getQualityLevel(); // 0 on a fast device
   * ```
   * @remarks A busy page or a screen locked at 30 Hz (e.g. a phone's low-power mode) does not lower the
   * quality, since drawing less would not help there. With `fixedTimestep`, level `3` is skipped so replays
   * spawn the same particles.
   */
  readonly adaptiveQuality?: boolean;
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
