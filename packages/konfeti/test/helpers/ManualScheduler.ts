import type { FrameScheduler } from "../../src/types/FrameScheduler";

/**
 * Manually Stepped Frame Scheduler for Tests.
 */
export class ManualScheduler implements FrameScheduler {
  /**
   * Pending Frame Callbacks by Id.
   */
  private readonly pending = new Map<number, (time: number) => void>();

  /**
   * Next Request Id.
   */
  private nextId = 1;

  /**
   * Current Virtual Time in Milliseconds.
   */
  private time = 0;

  /**
   * Request Next Frame.
   *
   * @param callback - Frame Callback
   * @returns Frame Request Id
   */
  public readonly request = (callback: (time: number) => void): number => {
    const id = this.nextId++;
    this.pending.set(id, callback);
    return id;
  };

  /**
   * Cancel Frame Request.
   *
   * @param id - Frame Request Id
   */
  public readonly cancel = (id: number): void => {
    this.pending.delete(id);
  };

  /**
   * Run Pending Frames.
   *
   * @param frames - Number of Frames to Run
   * @param frameMs - Virtual Duration of Each Frame
   */
  public step(frames = 1, frameMs = 1000 / 60): void {
    for (let frame = 0; frame < frames; frame++) {
      this.time += frameMs;
      const callbacks = [...this.pending.values()];
      this.pending.clear();

      for (const callback of callbacks) {
        callback(this.time);
      }
    }
  }

  /**
   * Return Pending Frame Count.
   *
   * @returns Pending Frame Count
   */
  public getPendingCount(): number {
    return this.pending.size;
  }
}
