import type { ParticleState } from "./ParticleState";

/**
 * Writable Particle Passed to `onParticleUpdate`.
 * Changing position/velocity here customizes motion per frame.
 */
export type MutableParticle = {
  -readonly [K in keyof ParticleState]: ParticleState[K];
};
