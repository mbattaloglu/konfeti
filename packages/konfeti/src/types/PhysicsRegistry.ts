/**
 * Custom Physics Registry.
 * Empty by default. Augment it to declare options of modules added with `definePhysics()`; they then
 * appear as typed keys of `physics`.
 *
 * @example
 * ```ts
 * declare module "konfeti" {
 *   interface PhysicsRegistry {
 *     magnet: { x?: number; y?: number; strength?: number };
 *   }
 * }
 * Konfeti.fire({ physics: { magnet: { strength: 900 } } });
 * ```
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-empty-object-type -- open for declaration merging
export interface PhysicsRegistry {}
