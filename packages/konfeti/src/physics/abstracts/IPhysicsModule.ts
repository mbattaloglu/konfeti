import type { Particle } from "../../particles/Particle";
import type { PhysicsWorld } from "./PhysicsWorld";

/**
 * Physics Module Contract.
 * Force modules run before position integration, constraint modules after it. Modules must not allocate.
 */
export type IPhysicsModule = {
  /**
   * Pipeline Stage.
   */
  readonly stage: "force" | "constraint";

  /**
   * Apply Module to Particle.
   *
   * @param particle - Particle
   * @param dt - Time Step in Seconds
   * @param world - Simulation Bounds
   */
  apply(particle: Particle, dt: number, world: PhysicsWorld): void;
};
