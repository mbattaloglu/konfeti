import type { EmitterTarget } from "./EmitterTarget";

/**
 * Continuous Emitter Handle.
 * Returned by `emit()`. Awaiting it resolves once the emitter was stopped and its last particle is gone.
 *
 * @example
 * ```ts
 * const fountain = Konfeti.emit({ rate: 40, follow: button });
 * fountain.moveTo("pointer"); // follow the pointer instead
 * fountain.stop();
 * await fountain; // every particle has finished
 * ```
 */
export type KonfetiEmitter = PromiseLike<void> & {
  /**
   * Stop Emitting.
   * No new particles are created; the ones already out keep flying until their lifetime ends.
   */
  stop(): void;
  /**
   * Stop and Remove Everything Now.
   * Ends the emitter and clears its particles immediately.
   */
  clear(): void;
  /**
   * Change What the Emitter Follows.
   *
   * @param target - Element, `"pointer"` or Normalized Point
   */
  moveTo(target: EmitterTarget): void;
  /**
   * Freeze the Emitter and Its Particles.
   */
  pause(): void;
  /**
   * Continue After pause().
   */
  resume(): void;
  /**
   * Check Whether pause() Is in Effect.
   *
   * @returns Paused Flag
   */
  isPaused(): boolean;
  /**
   * Check Whether It Still Creates Particles (false after stop() / clear()).
   *
   * @returns Emitting Flag
   */
  isEmitting(): boolean;
  /**
   * Check Whether It Stopped and Every Particle Is Gone.
   *
   * @returns Finished Flag
   */
  isFinished(): boolean;
  /**
   * Return Live Particle Count.
   *
   * @returns Particles Currently on Screen
   */
  getParticleCount(): number;
};
