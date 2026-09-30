import type { IFormation } from "../formation/abstracts/IFormation";
import type { Particle } from "../particles/Particle";
import type { ResolvedPhysics } from "../types/resolved/ResolvedPhysics";
import type { IPhysicsModule } from "./abstracts/IPhysicsModule";
import type { PhysicsWorld } from "./abstracts/PhysicsWorld";
import { AttractModule } from "./concretes/AttractModule";
import { CustomPhysicsModule } from "./concretes/CustomPhysicsModule";
import { DragModule } from "./concretes/DragModule";
import { FloorModule } from "./concretes/FloorModule";
import { ForceModule } from "./concretes/ForceModule";
import { SwirlModule } from "./concretes/SwirlModule";
import { TerminalVelocityModule } from "./concretes/TerminalVelocityModule";

/**
 * Composable Physics Pipeline.
 * Runs force modules, integrates motion and phases, then runs constraint modules. Built once per burst from
 * its resolved physics, so disabled features cost nothing per frame.
 */
export class PhysicsPipeline {
  /**
   * Milliseconds per Second.
   */
  private static readonly MS_PER_SECOND = 1000;

  /**
   * Force Stage Module List.
   */
  private readonly forces: IPhysicsModule[] = [];

  /**
   * Constraint Stage Module List.
   */
  private readonly constraints: IPhysicsModule[] = [];

  /**
   * Modules with a Per-Frame Preparation Step.
   */
  private readonly framed: IPhysicsModule[] = [];

  /**
   * Floor Enabled Flag.
   */
  private readonly _hasFloor: boolean;

  /**
   * Burst Formation (moves forming particles instead of the physics), or Null.
   */
  private readonly formation: IFormation | null;

  /**
   * Create Pipeline from Resolved Physics.
   *
   * @param physics - Resolved Physics
   * @param formation - Burst Formation, or Null
   */
  public constructor(physics: ResolvedPhysics, formation: IFormation | null = null) {
    this.formation = formation;
    const modules: IPhysicsModule[] = [new ForceModule()];

    if (physics.swirl !== null) {
      modules.push(new SwirlModule());
    }

    if (physics.attract !== null) {
      modules.push(
        new AttractModule(physics.attract.target, physics.attract.radius, physics.attract.falloff),
      );
    }

    modules.push(new DragModule());

    if (Number.isFinite(physics.terminalVelocity)) {
      modules.push(new TerminalVelocityModule(physics.terminalVelocity));
    }

    if (physics.floor !== null) {
      modules.push(new FloorModule(physics.floor.y, physics.floor.bounce, physics.floor.friction));
    }

    for (const custom of physics.custom) {
      modules.push(new CustomPhysicsModule(custom.definition, custom.options));
    }

    for (const module of modules) {
      (module.stage === "force" ? this.forces : this.constraints).push(module);

      if (module.beginFrame !== undefined) {
        this.framed.push(module);
      }
    }

    this._hasFloor = physics.floor !== null;
  }

  /**
   * Advance Particle by Time Step.
   *
   * @param particle - Particle
   * @param dt - Time Step in Seconds
   * @param world - Simulation Bounds
   */
  public step(particle: Particle, dt: number, world: PhysicsWorld): void {
    // held in the shape: no forces and no aging yet, but the piece keeps spinning and flipping
    if (particle.isForming && this.formation?.step(particle, dt) === true) {
      particle.rotation += particle.rotationSpeed * dt;
      particle.flipPhase += particle.flipSpeed * dt;
      return;
    }

    for (const module of this.forces) {
      module.apply(particle, dt, world);
    }

    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.rotation += particle.rotationSpeed * dt;
    particle.flipPhase += particle.flipSpeed * dt;
    particle.wobblePhase += particle.wobbleSpeed * dt;
    particle.age += dt * PhysicsPipeline.MS_PER_SECOND;

    for (const module of this.constraints) {
      module.apply(particle, dt, world);
    }
  }

  /**
   * Run Every Module's Per-Frame Preparation (once per burst per frame, before its particles).
   *
   * @param world - Simulation World
   */
  public beginFrame(world: PhysicsWorld): void {
    for (const module of this.framed) {
      module.beginFrame?.(world);
    }
  }

  /**
   * Release Module Resources (called when the burst finishes).
   */
  public dispose(): void {
    for (const module of [...this.forces, ...this.constraints]) {
      module.dispose?.();
    }
  }

  /**
   * Return Floor Enabled State.
   *
   * @returns Floor Enabled State
   */
  public hasFloor(): boolean {
    return this._hasFloor;
  }
}
