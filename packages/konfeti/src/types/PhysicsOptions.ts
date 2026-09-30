import type { AttractOptions } from "./AttractOptions";
import type { FloorOptions } from "./FloorOptions";
import type { PhysicsRegistry } from "./PhysicsRegistry";
import type { Range } from "./Range";
import type { SwirlOptions } from "./SwirlOptions";
import type { PerSecond, PixelsPerSecond, PixelsPerSecondSquared } from "./Units";

/**
 * Custom Physics Module Keys (from `definePhysics()` via {@link PhysicsRegistry}).
 * `true` enables a module with its defaults, an object customizes it, `false` disables it.
 */
export type CustomPhysicsOptions = {
  readonly [K in keyof PhysicsRegistry]?: boolean | Partial<PhysicsRegistry[K]>;
};

/**
 * Built-in Motion Physics Settings.
 * Range values are sampled per particle, so pieces fall at slightly different rates.
 * Horizontal terminal speed is `wind / drag`, vertical terminal speed is `gravity / drag`.
 */
export type BuiltinPhysicsOptions = {
  /**
   * Downward Acceleration.
   * Negative values make particles float upward.
   *
   * @defaultValue `700`
   */
  readonly gravity?: Range<PixelsPerSecondSquared>;
  /**
   * Air Resistance.
   * How quickly particles lose speed. `0` = no resistance, higher = shorter bursts and slower falling.
   *
   * @defaultValue `3.5`
   */
  readonly drag?: Range<PerSecond>;
  /**
   * Horizontal Acceleration.
   * Positive pushes right, negative pushes left.
   *
   * @defaultValue `0`
   */
  readonly wind?: Range<PixelsPerSecondSquared>;
  /**
   * Speed Limit.
   * Caps the total speed of every particle. `Infinity` disables the cap.
   *
   * @defaultValue `Infinity`
   */
  readonly terminalVelocity?: PixelsPerSecond;
  /**
   * Looping Drift.
   * `true` uses the default swirl, `false` disables it, an object customizes it.
   *
   * @defaultValue `false`
   * @see {@link SwirlOptions}
   */
  readonly swirl?: boolean | SwirlOptions;
  /**
   * Floor Collision.
   * `true` uses the canvas bottom with default bounce, `false` lets particles fall off-screen.
   *
   * @defaultValue `false`
   * @see {@link FloorOptions}
   */
  readonly floor?: boolean | FloorOptions;
  /**
   * Attractor / Repulsor.
   * `true` pulls particles toward the pointer with the default strength, `false` disables it, an object sets the
   * target (pointer, element or point), strength (negative pushes away), reach and falloff.
   *
   * @defaultValue `false`
   * @example
   * ```ts
   * Konfeti.fire({ physics: { attract: true } });
   * Konfeti.fire({ physics: { attract: { target: { x: 0.5, y: 0.2 }, strength: 1200 } } });
   * ```
   * @see {@link AttractOptions}
   */
  readonly attract?: boolean | AttractOptions;
};

/**
 * Motion Physics Settings (built-in keys plus registered custom modules).
 */
export type PhysicsOptions = BuiltinPhysicsOptions & CustomPhysicsOptions;
