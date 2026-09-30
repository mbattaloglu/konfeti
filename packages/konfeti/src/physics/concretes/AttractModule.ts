import { OriginLocator } from "../../core/OriginLocator";
import { OriginTracker } from "../../core/OriginTracker";
import type { Particle } from "../../particles/Particle";
import type { AttractFalloff } from "../../types/AttractOptions";
import type { EmitterTarget } from "../../types/EmitterTarget";
import type { IPhysicsModule } from "../abstracts/IPhysicsModule";
import type { PhysicsWorld } from "../abstracts/PhysicsWorld";

/**
 * Attractor / Repulsor Force.
 * Pulls particles toward a tracked target (negative strength pushes away). The target is located once per frame
 * in `beginFrame`, so the per-particle `apply` only does arithmetic.
 */
export class AttractModule implements IPhysicsModule {
  /**
   * Distance Below which the Pull Is Skipped (avoids a singular direction and jitter at the target).
   */
  private static readonly CORE_RADIUS = 2;

  /**
   * Pipeline Stage.
   */
  public readonly stage = "force";

  /**
   * Tracked Target.
   */
  private readonly tracker: OriginTracker;

  /**
   * Reach in Pixels (Infinity = whole canvas).
   */
  private readonly radius: number;

  /**
   * Distance Falloff.
   */
  private readonly falloff: AttractFalloff;

  /**
   * Target X in Canvas Pixels (this frame).
   */
  private targetX = 0;

  /**
   * Target Y in Canvas Pixels (this frame).
   */
  private targetY = 0;

  /**
   * Target Located This Frame Flag.
   */
  private _isActive = false;

  /**
   * Create Module.
   *
   * @param target - Element, `"pointer"`, Normalized Point, or a Tracker Placed from Outside
   * @param radius - Reach in Pixels
   * @param falloff - Distance Falloff
   */
  public constructor(
    target: EmitterTarget | OriginTracker,
    radius: number,
    falloff: AttractFalloff,
  ) {
    this.radius = radius;
    this.falloff = falloff;

    if (target instanceof OriginTracker) {
      this.tracker = target;
    } else {
      this.tracker = new OriginTracker();
      this.tracker.moveTo(target);
    }
  }

  /**
   * Locate the Target for This Frame.
   *
   * @param world - Simulation World
   */
  public beginFrame(world: PhysicsWorld): void {
    const origin = this.tracker.getOrigin();

    if (origin === null || world.surface === null) {
      this._isActive = false;
      return;
    }

    const box = OriginLocator.box(origin, world.surface);
    this.targetX = (box.x[0] + box.x[1]) / 2;
    this.targetY = (box.y[0] + box.y[1]) / 2;
    this._isActive = true;
  }

  /**
   * Accelerate Particle toward (or away from) the Target.
   *
   * @param particle - Particle
   * @param dt - Time Step in Seconds
   */
  public apply(particle: Particle, dt: number): void {
    if (!this._isActive || particle.attractStrength === 0) {
      return;
    }

    const dx = this.targetX - particle.x;
    const dy = this.targetY - particle.y;
    const distance = Math.hypot(dx, dy);

    if (distance < AttractModule.CORE_RADIUS || distance > this.radius) {
      return;
    }

    const scale =
      this.falloff === "linear" && Number.isFinite(this.radius) ? 1 - distance / this.radius : 1;
    const pull = (particle.attractStrength * scale * dt) / distance;
    particle.vx += dx * pull;
    particle.vy += dy * pull;
  }

  /**
   * Release the Target's Listeners (pointer tracking).
   */
  public dispose(): void {
    this.tracker.detach();
  }
}
