import type { KonfetiHandle } from "../types/KonfetiHandle";
import type { BurstAction } from "./WorkerProtocol";

/**
 * Handle for a Burst Running in the Worker.
 * Controls are forwarded as messages; the particle count is the worker's latest report.
 */
export class WorkerBurstHandle implements KonfetiHandle {
  /**
   * Completion Promise.
   */
  private readonly promise: Promise<void>;

  /**
   * Resolve Completion.
   */
  private readonly resolvePromise: () => void;

  /**
   * Reject Completion.
   */
  private readonly rejectPromise: (error: Error) => void;

  /**
   * Control Sender.
   */
  private readonly send: (action: BurstAction) => void;

  /**
   * Random Seed of the Burst (picked on the main thread, so it is known right away).
   */
  private readonly seed: number;

  /**
   * Last Reported Particle Count.
   */
  private particleCount = 0;

  /**
   * Paused State Flag.
   */
  private _isPaused = false;

  /**
   * Finished State Flag.
   */
  private _isFinished = false;

  /**
   * Create Handle.
   *
   * @param send - Control Sender
   * @param seed - Random Seed of the Burst
   */
  public constructor(send: (action: BurstAction) => void, seed = 0) {
    this.seed = seed;
    let resolver: () => void = () => undefined;
    let rejecter: (error: Error) => void = () => undefined;
    this.promise = new Promise<void>((resolve, reject) => {
      resolver = resolve;
      rejecter = reject;
    });
    this.resolvePromise = resolver;
    this.rejectPromise = rejecter;
    this.send = send;
  }

  /**
   * Attach Promise Callbacks.
   *
   * @param onFulfilled - Completion Callback
   * @param onRejected - Rejection Callback (invalid options are reported by the worker asynchronously)
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
   * Freeze Burst in Place.
   */
  public pause(): void {
    if (!this._isFinished) {
      this._isPaused = true;
      this.send("pause");
    }
  }

  /**
   * Resume Paused Burst.
   */
  public resume(): void {
    if (this._isPaused && !this._isFinished) {
      this._isPaused = false;
      this.send("resume");
    }
  }

  /**
   * Remove Burst Immediately.
   */
  public stop(): void {
    if (!this._isFinished) {
      this.send("stop");
    }
  }

  /**
   * End a Continuous Emitter (live particles finish in the worker).
   */
  public end(): void {
    if (!this._isFinished) {
      this.send("end");
    }
  }

  /**
   * Return Paused State.
   *
   * @returns Paused State
   */
  public isPaused(): boolean {
    return this._isPaused;
  }

  /**
   * Return Finished State.
   *
   * @returns Finished State
   */
  public isFinished(): boolean {
    return this._isFinished;
  }

  /**
   * Return Last Reported Particle Count.
   *
   * @returns Particle Count (updated a few times per second)
   */
  public getParticleCount(): number {
    return this.particleCount;
  }

  /**
   * Store Reported Particle Count.
   *
   * @param count - Particle Count
   */
  public setParticleCount(count: number): void {
    this.particleCount = count;
  }

  /**
   * Mark Finished and Resolve.
   */
  public complete(): void {
    if (!this._isFinished) {
      this._isFinished = true;
      this.particleCount = 0;
      this.resolvePromise();
    }
  }

  /**
   * Mark Finished and Reject.
   *
   * @param message - Error Message from the Worker
   */
  public fail(message: string): void {
    if (!this._isFinished) {
      this._isFinished = true;
      this.particleCount = 0;
      this.rejectPromise(new TypeError(message));
    }
  }

  /**
   * Return the Random Seed.
   *
   * @returns Seed
   */
  public getSeed(): number {
    return this.seed;
  }
}
