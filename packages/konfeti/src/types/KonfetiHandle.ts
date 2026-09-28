/**
 * Burst Control Handle.
 * Returned by `fire()` (on `Konfeti` or any instance). Awaitable: resolves when every particle of the burst is gone (or it is stopped).
 *
 * @example
 * ```ts
 * const burst = Konfeti.fire();
 * burst.pause();
 * setTimeout(() => burst.resume(), 500);
 * await burst; // finished
 * ```
 */
export type KonfetiHandle = PromiseLike<void> & {
  /**
   * Freeze Burst in Place.
   * Particles stay visible but stop moving and aging.
   */
  pause(): void;
  /**
   * Resume Paused Burst.
   */
  resume(): void;
  /**
   * Remove Burst Immediately.
   * Clears its particles and resolves the handle.
   */
  stop(): void;
  /**
   * Return Paused State.
   *
   * @returns Paused State
   */
  isPaused(): boolean;
  /**
   * Return Finished State.
   *
   * @returns Finished State
   */
  isFinished(): boolean;
  /**
   * Return Live Particle Count.
   *
   * @returns Live Particle Count
   */
  getParticleCount(): number;
};
