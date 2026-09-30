/**
 * Frame-Rate Watcher for Adaptive Quality.
 * Smooths the frame time and konfeti's own work per frame, and moves one quality level at a time: down when
 * frames stay slow while konfeti is a real part of the cost, up after they stay fast for longer. A level that
 * has to drop again right after rising waits twice as long before the next try, so it does not flicker.
 */
export class QualityMonitor {
  /**
   * Weight of the Newest Frame in the Smoothed Times.
   */
  private static readonly SMOOTHING = 0.1;

  /**
   * Frames Ignored after Each Start (the first frames pay for rasterizing and warm-up).
   */
  private static readonly WARMUP_FRAMES = 10;

  /**
   * Slowest Acceptable Smoothed Frame Time in Milliseconds (50 fps).
   */
  private static readonly SLOW_FRAME_MS = 20;

  /**
   * Share of a Slow Frame konfeti Must Take before It Steps Back (a busy page or a 30 Hz screen is not its fault).
   */
  private static readonly WORK_SHARE = 0.3;

  /**
   * Smoothed Frame Time Below which Frames Count as Fast, in Milliseconds (about 58 fps).
   */
  private static readonly FAST_FRAME_MS = 17.2;

  /**
   * Time Frames Must Stay Slow before the Quality Drops, in Milliseconds.
   */
  private static readonly DEGRADE_AFTER_MS = 500;

  /**
   * First Wait before the Quality Rises Again, in Milliseconds (doubles after a failed try).
   */
  private static readonly RECOVER_AFTER_MS = 3000;

  /**
   * Longest Wait before the Quality Rises Again, in Milliseconds.
   */
  private static readonly MAX_RECOVER_AFTER_MS = 60_000;

  /**
   * A Drop This Soon after a Rise Counts as a Failed Try, in Milliseconds.
   */
  private static readonly RELAPSE_MS = 2000;

  /**
   * Longest Frame Taken into Account, in Milliseconds (a stall, not a frame rate).
   */
  private static readonly MAX_FRAME_MS = 250;

  /**
   * Lowest Level (Highest Number) This Monitor May Reach.
   */
  private readonly maxLevel: number;

  /**
   * Current Level (`0` = full quality).
   */
  private level = 0;

  /**
   * Smoothed Frame Time in Milliseconds.
   */
  private frameAverage = 0;

  /**
   * Smoothed konfeti Work per Frame in Milliseconds.
   */
  private workAverage = 0;

  /**
   * Frames Since the Last Start.
   */
  private frames = 0;

  /**
   * Time the Frames Have Stayed Slow, in Milliseconds.
   */
  private slowFor = 0;

  /**
   * Time the Frames Have Stayed Fast, in Milliseconds.
   */
  private fastFor = 0;

  /**
   * Current Wait before Rising, in Milliseconds.
   */
  private recoverAfter = QualityMonitor.RECOVER_AFTER_MS;

  /**
   * Time Since the Last Rise, in Milliseconds.
   */
  private sinceRise = Infinity;

  /**
   * Create Monitor.
   *
   * @param maxLevel - Lowest Level (Highest Number) Allowed
   */
  public constructor(maxLevel: number) {
    this.maxLevel = maxLevel;
  }

  /**
   * Record One Frame.
   *
   * @param frameMs - Time Since the Previous Frame
   * @param workMs - Time konfeti Spent Simulating and Drawing This Frame
   * @returns Level Changed Flag
   */
  public sample(frameMs: number, workMs: number): boolean {
    const frame = Math.min(Math.max(frameMs, 0), QualityMonitor.MAX_FRAME_MS);
    const smoothing = this.frames === 0 ? 1 : QualityMonitor.SMOOTHING;
    this.frames++;
    this.frameAverage += (frame - this.frameAverage) * smoothing;
    this.workAverage += (Math.max(workMs, 0) - this.workAverage) * smoothing;
    this.sinceRise += frame;

    if (this.frames <= QualityMonitor.WARMUP_FRAMES) {
      return false;
    }

    const isSlow =
      this.frameAverage > QualityMonitor.SLOW_FRAME_MS &&
      this.workAverage > this.frameAverage * QualityMonitor.WORK_SHARE;

    if (isSlow) {
      this.fastFor = 0;
      this.slowFor += frame;
      return this.slowFor >= QualityMonitor.DEGRADE_AFTER_MS && this.lower();
    }

    this.slowFor = 0;
    this.fastFor = this.frameAverage < QualityMonitor.FAST_FRAME_MS ? this.fastFor + frame : 0;
    return this.fastFor >= this.recoverAfter && this.raise();
  }

  /**
   * Start Over after an Idle Pause (the level and the learned wait stay).
   */
  public restart(): void {
    this.frames = 0;
    this.frameAverage = 0;
    this.workAverage = 0;
    this.slowFor = 0;
    this.fastFor = 0;
  }

  /**
   * Return Current Level.
   *
   * @returns Level (`0` = full quality)
   */
  public getLevel(): number {
    return this.level;
  }

  /**
   * Step One Level Down in Quality.
   *
   * @returns Changed Flag
   */
  private lower(): boolean {
    this.slowFor = 0;

    if (this.level >= this.maxLevel) {
      return false;
    }

    // dropping right after a rise: the higher level did not hold, so wait longer before the next try
    if (this.sinceRise < QualityMonitor.RELAPSE_MS) {
      this.recoverAfter = Math.min(this.recoverAfter * 2, QualityMonitor.MAX_RECOVER_AFTER_MS);
    }

    this.level++;
    return true;
  }

  /**
   * Step One Level Up in Quality.
   *
   * @returns Changed Flag
   */
  private raise(): boolean {
    this.fastFor = 0;

    if (this.level === 0) {
      return false;
    }

    this.level--;
    this.sinceRise = 0;
    return true;
  }
}
