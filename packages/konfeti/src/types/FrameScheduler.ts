/**
 * Animation Frame Scheduler.
 * Abstraction over `requestAnimationFrame`, mainly so tests can step frames manually.
 */
export type FrameScheduler = {
  /**
   * Request Next Frame.
   *
   * @param callback - Frame Callback receiving a high-resolution timestamp in milliseconds
   * @returns Frame Request Id
   */
  readonly request: (callback: (time: number) => void) => number;
  /**
   * Cancel Frame Request.
   *
   * @param id - Frame Request Id
   */
  readonly cancel: (id: number) => void;
};
