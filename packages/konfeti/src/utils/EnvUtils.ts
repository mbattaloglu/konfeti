/**
 * Static Browser Environment Helpers.
 * Every accessor is safe to call during SSR (no `window` access at import time).
 */
export class EnvUtils {
  /**
   * Reduced Motion Media Query.
   */
  private static readonly REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

  /**
   * Check DOM Availability.
   *
   * @returns DOM Available Flag
   */
  public static hasDom(): boolean {
    return typeof window !== "undefined" && typeof document !== "undefined";
  }

  /**
   * Check Reduced Motion Preference.
   *
   * @returns Reduced Motion Flag
   */
  public static prefersReducedMotion(): boolean {
    return EnvUtils.hasDom() && typeof window.matchMedia === "function"
      ? window.matchMedia(EnvUtils.REDUCED_MOTION_QUERY).matches
      : false;
  }

  /**
   * Return Capped Device Pixel Ratio.
   *
   * @param cap - Maximum Ratio
   * @returns Device Pixel Ratio
   */
  public static getDevicePixelRatio(cap: number): number {
    const ratio = EnvUtils.hasDom() && window.devicePixelRatio > 0 ? window.devicePixelRatio : 1;
    return Math.min(ratio, Math.max(cap, 1));
  }
}
