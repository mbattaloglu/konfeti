import type { Particle } from "../../particles/Particle";
import type { IPhysicsModule } from "../abstracts/IPhysicsModule";

/**
 * Gravity and Wind Force Module.
 * Uses each particle's own sampled gravity and wind.
 */
export class ForceModule implements IPhysicsModule {
  /**
   * Pipeline Stage.
   */
  public readonly stage = "force";

  /**
   * Apply Gravity and Wind.
   *
   * @param particle - Particle
   * @param dt - Time Step in Seconds
   */
  public apply(particle: Particle, dt: number): void {
    particle.vx += particle.wind * dt;
    particle.vy += particle.gravity * dt;
  }
}
