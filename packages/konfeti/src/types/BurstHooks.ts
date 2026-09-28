import type { MutableParticle } from "./MutableParticle";
import type { ParticleState } from "./ParticleState";

/**
 * Burst Lifecycle Hooks.
 *
 * @example
 * ```ts
 * Konfeti.fire({
 *   onParticleDeath: (p) => sparkAt(p.x, p.y),
 *   onComplete: () => console.log("done"),
 * });
 * ```
 */
export type BurstHooks = {
  /**
   * Start Callback.
   * Called once, right after the first particles spawn.
   */
  readonly onStart?: () => void;
  /**
   * Particle Spawn Callback.
   */
  readonly onParticleSpawn?: (particle: ParticleState) => void;
  /**
   * Particle Update Callback.
   * Called for every live particle every frame, after physics.
   *
   * @remarks Runs in the hot path — keep it allocation-free.
   */
  readonly onParticleUpdate?: (particle: MutableParticle, dt: number) => void;
  /**
   * Particle Death Callback.
   * Called before the particle returns to the pool; do not keep the reference.
   */
  readonly onParticleDeath?: (particle: ParticleState) => void;
  /**
   * Complete Callback.
   * Called when emission has ended and every particle is gone (also after `stop()`).
   */
  readonly onComplete?: () => void;
};
