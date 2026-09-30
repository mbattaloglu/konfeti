import type { EmitterTarget } from "../types/EmitterTarget";
import type { KonfetiEmitter } from "../types/KonfetiEmitter";
import type { OriginPoint } from "../types/OriginPoint";
import type { WorkerBurstHandle } from "./WorkerBurstHandle";
import { WorkerTargetFollower } from "./WorkerTargetFollower";

/**
 * Continuous Emitter Handle (worker mode).
 * The worker cannot see the DOM, so this handle follows the target on the main thread — the pointer through
 * `pointermove`, an element through a per-frame measurement — and sends it over as a normalized point.
 */
export class WorkerEmitterHandle implements KonfetiEmitter {
  /**
   * Burst Handle Mirroring the Worker-Side Emitter.
   */
  private readonly handle: WorkerBurstHandle;

  /**
   * Follows the Emitter's Target and Sends Its Places to the Worker.
   */
  private readonly follower: WorkerTargetFollower;

  /**
   * Emitting State Flag.
   */
  private _isEmitting = true;

  /**
   * Create Handle.
   *
   * @param handle - Burst Handle of the Worker Emitter
   * @param move - Place Sender
   * @param measure - Element / Viewport Point to Normalized Point Converter
   * @param target - Initial Target
   */
  public constructor(
    handle: WorkerBurstHandle,
    move: (at: OriginPoint | null) => void,
    measure: (origin: Element | { clientX: number; clientY: number }) => OriginPoint,
    target: EmitterTarget,
  ) {
    this.handle = handle;
    this.follower = new WorkerTargetFollower(move, measure);
    this.follower.follow(target, false);

    const detach = (): void => {
      this._isEmitting = false;
      this.follower.unfollow();
    };
    void handle.then(detach, detach);
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
  ): PromiseLike<TResult1 | TResult2> {
    return this.handle.then(onFulfilled, onRejected);
  }

  /**
   * Stop Emitting (live particles finish in the worker).
   */
  public stop(): void {
    if (this._isEmitting) {
      this._isEmitting = false;
      this.follower.unfollow();
      this.handle.end();
    }
  }

  /**
   * Stop and Remove Every Particle Now.
   */
  public clear(): void {
    this._isEmitting = false;
    this.follower.unfollow();
    this.handle.stop();
  }

  /**
   * Change What the Emitter Follows.
   *
   * @param target - Element, `"pointer"` or Normalized Point
   */
  public moveTo(target: EmitterTarget): void {
    if (this._isEmitting) {
      this.follower.follow(target, true);
    }
  }

  /**
   * Freeze Emitter and Particles.
   */
  public pause(): void {
    this.handle.pause();
  }

  /**
   * Continue After pause().
   */
  public resume(): void {
    this.handle.resume();
  }

  /**
   * Return Paused State.
   *
   * @returns Paused Flag
   */
  public isPaused(): boolean {
    return this.handle.isPaused();
  }

  /**
   * Return Emitting State.
   *
   * @returns Emitting Flag
   */
  public isEmitting(): boolean {
    return this._isEmitting;
  }

  /**
   * Return Finished State.
   *
   * @returns Finished Flag
   */
  public isFinished(): boolean {
    return this.handle.isFinished();
  }

  /**
   * Return Last Reported Particle Count.
   *
   * @returns Particle Count (updated a few times per second)
   */
  public getParticleCount(): number {
    return this.handle.getParticleCount();
  }
}
