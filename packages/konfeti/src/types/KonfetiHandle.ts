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
  /**
   * Return the Random Seed.
   * Fire the same options with this seed to get the same burst again: the same particles with the same
   * colors, sizes and launch values, and exactly the same motion on instances with `fixedTimestep`. For a
   * combined handle from `fire([...])`, the seed of the first burst (give each entry its own `seed` to replay
   * a list).
   *
   * @returns Seed
   * @example
   * ```ts
   * const seed = Konfeti.fire().getSeed();
   * Konfeti.fire({ seed }); // the same burst again
   * ```
   */
  getSeed(): number;
};
