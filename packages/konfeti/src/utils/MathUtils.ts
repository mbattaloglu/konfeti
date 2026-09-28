/**
 * Static Math Helpers.
 */
export class MathUtils {
  /**
   * Full Circle in Radians.
   */
  public static readonly TAU = Math.PI * 2;

  /**
   * Degrees-to-Radians Factor.
   */
  public static readonly DEG_TO_RAD = Math.PI / 180;

  /**
   * Clamp Value into Range.
   *
   * @param value - Input Value
   * @param min - Lower Bound
   * @param max - Upper Bound
   * @returns Clamped Value
   */
  public static clamp(value: number, min: number, max: number): number {
    return value < min ? min : value > max ? max : value;
  }

  /**
   * Interpolate Linearly between Two Values.
   *
   * @param from - Start Value
   * @param to - End Value
   * @param t - Progress (0–1)
   * @returns Interpolated Value
   */
  public static lerp(from: number, to: number, t: number): number {
    return from + (to - from) * t;
  }
}
