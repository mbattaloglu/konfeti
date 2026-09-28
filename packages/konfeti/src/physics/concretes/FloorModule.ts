import type { Particle } from "../../particles/Particle";
import type { IPhysicsModule } from "../abstracts/IPhysicsModule";
import type { PhysicsWorld } from "../abstracts/PhysicsWorld";

/**
 * Floor Collision Constraint.
 * Bounces particles off a horizontal line, then lets them settle and rest there.
 */
export class FloorModule implements IPhysicsModule {
  /**
   * Pipeline Stage.
   */
  public readonly stage = "constraint";

  /**
   * Vertical Speed below which a Bouncing Particle Comes to Rest (px/s).
   */
  private static readonly REST_SPEED = 40;

  /**
   * Damping Rate While Resting (1/s).
   */
  private static readonly REST_DAMPING = 6;

  /**
   * Floor Position as Canvas Height Fraction.
   */
  private readonly y: number;

  /**
   * Kept Vertical Speed Fraction per Bounce.
   */
  private readonly bounce: number;

  /**
   * Lost Horizontal Speed and Spin Fraction per Bounce.
   */
  private readonly friction: number;

  /**
   * Create Module.
   *
   * @param y - Floor Position as Canvas Height Fraction
   * @param bounce - Kept Vertical Speed Fraction per Bounce
   * @param friction - Lost Horizontal Speed and Spin Fraction per Bounce
   */
  public constructor(y: number, bounce: number, friction: number) {
    this.y = y;
    this.bounce = bounce;
    this.friction = friction;
  }

  /**
   * Resolve Floor Contact.
   *
   * @param particle - Particle
   * @param dt - Time Step in Seconds
   * @param world - Simulation Bounds
   */
  public apply(particle: Particle, dt: number, world: PhysicsWorld): void {
    const halfExtent = Math.max(particle.width, particle.height) / 2;
    const floor = this.y * world.height - halfExtent;

    if (particle.y < floor) {
      return;
    }

    particle.y = floor;

    if (particle.isResting) {
      const damping = Math.exp(-FloorModule.REST_DAMPING * dt);
      particle.vy = 0;
      particle.vx *= damping;
      particle.rotationSpeed *= damping;
      particle.flipSpeed *= damping;
      return;
    }

    if (particle.vy > 0) {
      particle.vy = -particle.vy * this.bounce;
      particle.vx *= 1 - this.friction;
      particle.rotationSpeed *= 1 - this.friction;
      particle.flipSpeed *= 1 - this.friction;
    }

    if (Math.abs(particle.vy) < FloorModule.REST_SPEED) {
      particle.vy = 0;
      particle.isResting = true;
      particle.wobbleSpeed = 0;
    }
  }
}
