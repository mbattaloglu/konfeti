/**
 * Seedable Pseudo-Random Number Generator.
 * Mulberry32 — tiny, fast and good enough for visuals; identical seeds give identical sequences.
 */
export class Random {
  /**
   * Mulberry32 State Increment.
   */
  private static readonly INCREMENT = 0x6d2b79f5;

  /**
   * 32-bit Range Divisor.
   */
  private static readonly UINT32_RANGE = 4294967296;

  /**
   * Current Generator State.
   */
  private state: number;

  /**
   * Create Generator from Seed.
   *
   * @param seed - Integer Seed
   */
  public constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /**
   * Create Random Seed.
   *
   * @returns Unsigned 32-bit Seed
   */
  public static createSeed(): number {
    return Math.floor(Math.random() * Random.UINT32_RANGE) >>> 0;
  }

  /**
   * Return Next Random Float.
   *
   * @returns Float in `[0, 1)`
   */
  public next(): number {
    this.state = (this.state + Random.INCREMENT) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / Random.UINT32_RANGE;
  }

  /**
   * Return Random Float between Bounds.
   *
   * @param min - Lower Bound
   * @param max - Upper Bound
   * @returns Float in `[min, max)`
   */
  public between(min: number, max: number): number {
    return min + (max - min) * this.next();
  }
}
