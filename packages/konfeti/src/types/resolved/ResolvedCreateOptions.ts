import type { FireOptions } from "../FireOptions";
import type { FrameScheduler } from "../FrameScheduler";

/**
 * Fully Resolved Instance Options.
 */
export type ResolvedCreateOptions = {
  /**
   * Automatic Resize Flag.
   */
  readonly resize: boolean;
  /**
   * Overlay z-index.
   */
  readonly zIndex: number;
  /**
   * Maximum Live Particles.
   */
  readonly maxParticles: number;
  /**
   * Device Pixel Ratio Cap.
   */
  readonly maxDevicePixelRatio: number;
  /**
   * Reduced Motion Flag.
   */
  readonly disableForReducedMotion: boolean;
  /**
   * Instance Default Burst Options.
   */
  readonly defaults: FireOptions;
  /**
   * Frame Scheduler (`null` uses `requestAnimationFrame`).
   */
  readonly frameScheduler: FrameScheduler | null;
};
