import type { Particle } from "./Particle";

/**
 * Static Spritesheet Frame Advancer.
 */
export class SpriteAnimator {
  /**
   * Advance Sprite Frame.
   *
   * @param particle - Particle
   * @param dtMs - Time Step in Milliseconds
   */
  public static advance(particle: Particle, dtMs: number): void {
    if (particle.frameDuration <= 0 || particle.frameCount <= 1) {
      return;
    }

    particle.frameElapsed += dtMs;

    while (particle.frameElapsed >= particle.frameDuration) {
      particle.frameElapsed -= particle.frameDuration;

      if (particle.frameIndex + 1 < particle.frameCount) {
        particle.frameIndex++;
      } else if (particle.frameLoop) {
        particle.frameIndex = 0;
      } else {
        // hold the last frame
        particle.frameElapsed = 0;
        return;
      }
    }
  }
}
