import { PhysicsDefinitions } from "../registry/PhysicsDefinitions";
import type { PhysicsDefinition } from "../types/PhysicsDefinition";
import type { BuiltinPhysicsOptions } from "../types/PhysicsOptions";
import type { PhysicsRegistry } from "../types/PhysicsRegistry";

/**
 * Register Custom Physics Module.
 * Declare its options on {@link PhysicsRegistry} first; enable it per burst with `physics: { name: … }`.
 * Registering the same name again replaces the definition.
 *
 * @param name - Module Name (not a built-in physics key)
 * @param definition - Module Definition
 * @throws TypeError for built-in keys
 * @example
 * ```ts
 * declare module "konfeti" {
 *   interface PhysicsRegistry {
 *     magnet: { x: number; y: number; strength: number };
 *   }
 * }
 *
 * definePhysics("magnet", {
 *   defaults: { x: 0.5, y: 0.5, strength: 600 },
 *   apply: (p, dt, world, { x, y, strength }) => {
 *     p.vx += (x * world.width - p.x) * strength * dt * 0.001;
 *     p.vy += (y * world.height - p.y) * strength * dt * 0.001;
 *   },
 * });
 *
 * Konfeti.fire({ physics: { magnet: { strength: 900 } } });
 * ```
 */
export function definePhysics<
  K extends Exclude<keyof PhysicsRegistry, keyof BuiltinPhysicsOptions>,
>(name: K, definition: PhysicsDefinition<PhysicsRegistry[K] & object>): void {
  PhysicsDefinitions.define(name, definition);
}
