import type { Particle } from "../../particles/Particle";
import type { IPhysicsModule } from "../abstracts/IPhysicsModule";

/**
 * Exponential Air Drag Module.
 * Frame-rate independent: velocity is multiplied by `e^(-drag × dt)`.
 */
export class DragModule implements IPhysicsModule {
  /**
   * Pipeline Stage.
   */
  public readonly stage = "force";

  /**
   * Apply Drag.
   *
   * @param particle - Particle
   * @param dt - Time Step in Seconds
   */
  public apply(particle: Particle, dt: number): void {
    if (particle.drag > 0) {
      const damping = Math.exp(-particle.drag * dt);
      particle.vx *= damping;
      particle.vy *= damping;
    }
  }
}
