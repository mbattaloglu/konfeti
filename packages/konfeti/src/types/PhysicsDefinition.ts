import type { MutableParticle } from "./MutableParticle";
import type { PhysicsWorldState } from "./PhysicsWorldState";

/**
 * Custom Physics Module Definition.
 * Enabled per burst with `physics: { <name>: true | { ...options } }`; `true` uses `defaults`.
 *
 * @example
 * ```ts
 * definePhysics("magnet", {
 *   defaults: { x: 0.5, y: 0.5, strength: 600 },
 *   apply: (p, dt, world, { x, y, strength }) => {
 *     p.vx += (x * world.width - p.x) * strength * dt * 0.001;
 *     p.vy += (y * world.height - p.y) * strength * dt * 0.001;
 *   },
 * });
 * ```
 * @remarks `apply` runs for every particle every frame — keep it allocation-free.
 */
export type PhysicsDefinition<TOptions extends object> = {
  /**
   * Pipeline Stage.
   * `"force"` runs before positions update (change velocity), `"constraint"` after (clamp position).
   *
   * @defaultValue `"force"`
   */
  readonly stage?: "force" | "constraint";
  /**
   * Option Defaults (merged under the burst's options).
   */
  readonly defaults: Readonly<TOptions>;
  /**
   * Apply Module to One Particle.
   */
  readonly apply: (
    particle: MutableParticle,
    dt: number,
    world: PhysicsWorldState,
    options: Readonly<TOptions>,
  ) => void;
};
