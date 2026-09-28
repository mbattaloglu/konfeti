import type { Particle } from "../../particles/Particle";
import type { IPhysicsModule } from "../abstracts/IPhysicsModule";

/**
 * Swirl Force Module.
 * Pushes each particle along a slowly rotating direction so it drifts in loops.
 */
export class SwirlModule implements IPhysicsModule {
  /**
   * Pipeline Stage.
   */
  public readonly stage = "force";

  /**
   * Apply Rotating Push.
   *
   * @param particle - Particle
   * @param dt - Time Step in Seconds
   */
  public apply(particle: Particle, dt: number): void {
    particle.vx += Math.cos(particle.swirlPhase) * particle.swirlStrength * dt;
    particle.vy += Math.sin(particle.swirlPhase) * particle.swirlStrength * dt;
    particle.swirlPhase += particle.swirlSpeed * dt;
  }
}
