import type { Particle } from "../../particles/Particle";
import type { PhysicsDefinition } from "../../types/PhysicsDefinition";
import type { IPhysicsModule } from "../abstracts/IPhysicsModule";
import type { PhysicsWorld } from "../abstracts/PhysicsWorld";

/**
 * Adapter Running a `definePhysics()` Module inside the Pipeline.
 */
export class CustomPhysicsModule implements IPhysicsModule {
  /**
   * Pipeline Stage.
   */
  public readonly stage: "force" | "constraint";

  /**
   * User Definition.
   */
  private readonly definition: PhysicsDefinition<object>;

  /**
   * Merged Module Options.
   */
  private readonly options: object;

  /**
   * Create Adapter.
   *
   * @param definition - User Definition
   * @param options - Merged Module Options
   */
  public constructor(definition: PhysicsDefinition<object>, options: object) {
    this.definition = definition;
    this.options = options;
    this.stage = definition.stage ?? "force";
  }

  /**
   * Apply User Module.
   *
   * @param particle - Particle
   * @param dt - Time Step in Seconds
   * @param world - Simulation Bounds
   */
  public apply(particle: Particle, dt: number, world: PhysicsWorld): void {
    this.definition.apply(particle, dt, world, this.options);
  }
}
