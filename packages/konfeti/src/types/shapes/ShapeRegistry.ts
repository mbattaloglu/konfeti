/**
 * Custom Shape Registry.
 * Empty by default. Augment it to declare the options of shapes you add with `defineShape()`, so
 * `Konfeti.fire({ shapes: [{ type: "yourShape", ... }] })` is fully typed.
 *
 * @example
 * ```ts
 * declare module "konfeti" {
 *   interface ShapeRegistry {
 *     diamond: { sharpness?: number };
 *   }
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-empty-object-type -- open for declaration merging
export interface ShapeRegistry {}
