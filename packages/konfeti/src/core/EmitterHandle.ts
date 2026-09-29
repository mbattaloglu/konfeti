import type { EmitterTarget } from "../types/EmitterTarget";
import type { KonfetiEmitter } from "../types/KonfetiEmitter";
import type { Burst } from "./Burst";
import type { OriginTracker } from "./OriginTracker";

/**
 * Continuous Emitter Handle (main thread).
 * A thin view over a continuous {@link Burst} and the {@link OriginTracker} it reads its origin from.
 */
export class EmitterHandle implements KonfetiEmitter {
  /**
   * Continuous Burst.
   */
  private readonly burst: Burst;

  /**
   * Origin the Burst Follows.
   */
  private readonly tracker: OriginTracker;

  /**
   * Create Handle.
   *
   * @param burst - Continuous Burst
   * @param tracker - Origin Tracker
   */
  public constructor(burst: Burst, tracker: OriginTracker) {
    this.burst = burst;
    this.tracker = tracker;
  }

  /**
   * Attach Promise Callbacks (resolves after stop() once every particle is gone).
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
    return this.burst.then(onFulfilled, onRejected);
  }

  /**
   * Stop Emitting (live particles finish naturally).
   */
  public stop(): void {
    this.burst.endEmission();
  }

  /**
   * Stop and Remove Every Particle Now.
   */
  public clear(): void {
    this.burst.stop();
  }

  /**
   * Change What the Emitter Follows.
   *
   * @param target - Element, `"pointer"` or Normalized Point
   */
  public moveTo(target: EmitterTarget): void {
    this.tracker.moveTo(target);
  }

  /**
   * Freeze Emitter and Particles.
   */
  public pause(): void {
    this.burst.pause();
  }

  /**
   * Continue After pause().
   */
  public resume(): void {
    this.burst.resume();
  }

  /**
   * Return Paused State.
   *
   * @returns Paused Flag
   */
  public isPaused(): boolean {
    return this.burst.isPaused();
  }

  /**
   * Return Emitting State.
   *
   * @returns Emitting Flag
   */
  public isEmitting(): boolean {
    return !this.burst.isEmissionDone();
  }

  /**
   * Return Finished State.
   *
   * @returns Finished Flag
   */
  public isFinished(): boolean {
    return this.burst.isFinished();
  }

  /**
   * Return Live Particle Count.
   *
   * @returns Particle Count
   */
  public getParticleCount(): number {
    return this.burst.getParticleCount();
  }
}
