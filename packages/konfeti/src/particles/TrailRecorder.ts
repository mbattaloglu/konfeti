import type { Particle } from "./Particle";

/**
 * Static Trail Position Recorder.
 * Appends the particle's position to its ring buffer once per frame, after physics; allocation-free.
 */
export class TrailRecorder {
  /**
   * Record the Current Position.
   *
   * @param particle - Particle (ignored without a trail)
   */
  public static record(particle: Particle): void {
    const length = particle.trailLength;

    if (length === 0 || particle.trailX === null || particle.trailY === null) {
      return;
    }

    // the drawn position, not the physics one: otherwise the wobble sway pulls the particle off its trail
    particle.trailX[particle.trailHead] = particle.getDrawX();
    particle.trailY[particle.trailHead] = particle.y;
    particle.trailHead = (particle.trailHead + 1) % length;
    particle.trailCount = Math.min(particle.trailCount + 1, length);
  }
}
