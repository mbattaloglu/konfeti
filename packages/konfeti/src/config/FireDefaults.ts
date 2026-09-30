import type { AttractOptions } from "../types/AttractOptions";
import type { FireOptions } from "../types/FireOptions";
import type { FloorOptions } from "../types/FloorOptions";
import type { OriginPoint } from "../types/OriginPoint";
import type { BuiltinPhysicsOptions } from "../types/PhysicsOptions";
import type { SwirlOptions } from "../types/SwirlOptions";

/**
 * Default Swirl Settings (used when `swirl` is `true` or partially set).
 */
export const DEFAULT_SWIRL = {
  strength: [80, 200],
  frequency: [0.3, 0.8],
} as const satisfies Required<SwirlOptions>;

/**
 * Default Floor Settings (used when `floor` is `true` or partially set).
 */
export const DEFAULT_FLOOR = {
  y: 1,
  bounce: 0.35,
  friction: 0.4,
} as const satisfies Required<FloorOptions>;

/**
 * Default Attractor Settings (used when `attract` is `true` or partially set).
 */
export const DEFAULT_ATTRACT = {
  target: "pointer",
  strength: 900,
  radius: Infinity,
  falloff: "constant",
} as const satisfies Required<AttractOptions>;

/**
 * Default Physics Settings.
 */
export const DEFAULT_PHYSICS = {
  gravity: 700,
  drag: 3.5,
  wind: 0,
  terminalVelocity: Infinity,
  swirl: false,
  floor: false,
  attract: false,
} as const satisfies Required<BuiltinPhysicsOptions>;

/**
 * Default Spawn Point.
 */
export const DEFAULT_ORIGIN = {
  x: 0.5,
  y: 0.6,
} as const satisfies Required<OriginPoint>;

/**
 * Default Burst Options (top-level scalar keys only; nested groups have their own tables).
 */
export const DEFAULT_FIRE_OPTIONS = {
  particleCount: 60,
  angle: 90,
  spread: 60,
  startVelocity: [1000, 1800],
  lifetime: [2800, 3600],
  emission: { mode: "burst" },
} as const satisfies Required<
  Pick<
    FireOptions,
    "particleCount" | "angle" | "spread" | "startVelocity" | "lifetime" | "emission"
  >
>;
