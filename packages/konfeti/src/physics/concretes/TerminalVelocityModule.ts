import type { Particle } from "../../particles/Particle";
import type { IPhysicsModule } from "../abstracts/IPhysicsModule";

/**
 * Speed Limit Module.
 */
export class TerminalVelocityModule implements IPhysicsModule {
  /**
   * Pipeline Stage.
   */
  public readonly stage = "force";

  /**
   * Maximum Speed in px/s.
   */
  private readonly limit: number;

  /**
   * Create Module.
   *
   * @param limit - Maximum Speed in px/s
   */
  public constructor(limit: number) {
    this.limit = limit;
  }

  /**
   * Clamp Particle Speed.
   *
   * @param particle - Particle
   */
  public apply(particle: Particle): void {
    const speed = Math.hypot(particle.vx, particle.vy);

    if (speed > this.limit) {
      const factor = this.limit / speed;
      particle.vx *= factor;
      particle.vy *= factor;
    }
  }
}
