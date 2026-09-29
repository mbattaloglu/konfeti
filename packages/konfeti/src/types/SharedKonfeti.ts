import type { KonfetiInstance } from "../core/KonfetiInstance";

/**
 * Shared Fullscreen Konfeti.
 * The `Konfeti` object: the everyday API, drawing on a fullscreen overlay canvas that is created on the first
 * `Konfeti.fire()`. Use `KonfetiFactory.create()` for your own canvas or separate defaults.
 */
export type SharedKonfeti = Pick<
  KonfetiInstance,
  "fire" | "onClick" | "pause" | "resume" | "isPaused" | "reset" | "getParticleCount"
>;
