import type { KonfetiHandle } from "../types/KonfetiHandle";

/**
 * Combined Handle for Several Bursts.
 * Returned when `fire()` receives an array; every control call is forwarded to each burst.
 */
export class GroupHandle implements KonfetiHandle {
  /**
   * Child Handle List.
   */
  private readonly handles: readonly KonfetiHandle[];

  /**
   * Combined Completion Promise.
   */
  private readonly promise: Promise<void>;

  /**
   * Create Group.
   *
   * @param handles - Child Handles
   */
  public constructor(handles: readonly KonfetiHandle[]) {
    this.handles = handles;
    this.promise = Promise.all(handles.map(async (handle) => handle)).then(() => undefined);
  }

  /**
   * Attach Promise Callbacks.
   *
   * @param onFulfilled - Completion Callback
   * @param onRejected - Rejection Callback
   * @returns Chained Promise
   */
  public then<TResult1 = void, TResult2 = never>(
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- mirrors PromiseLike<void>.then
    onFulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | null,
    onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.promise.then(onFulfilled, onRejected);
  }

  /**
   * Pause Every Burst.
   */
  public pause(): void {
    for (const handle of this.handles) {
      handle.pause();
    }
  }

  /**
   * Resume Every Burst.
   */
  public resume(): void {
    for (const handle of this.handles) {
      handle.resume();
    }
  }

  /**
   * Stop Every Burst.
   */
  public stop(): void {
    for (const handle of this.handles) {
      handle.stop();
    }
  }

  /**
   * Return Paused State (all bursts paused).
   *
   * @returns Paused State
   */
  public isPaused(): boolean {
    return this.handles.every((handle) => handle.isPaused());
  }

  /**
   * Return Finished State (all bursts finished).
   *
   * @returns Finished State
   */
  public isFinished(): boolean {
    return this.handles.every((handle) => handle.isFinished());
  }

  /**
   * Return Total Live Particle Count.
   *
   * @returns Live Particle Count
   */
  public getParticleCount(): number {
    return this.handles.reduce((total, handle) => total + handle.getParticleCount(), 0);
  }
}
