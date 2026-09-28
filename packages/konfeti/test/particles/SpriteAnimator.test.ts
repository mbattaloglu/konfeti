import { describe, expect, it } from "vitest";

import { Particle } from "../../src/particles/Particle";
import { SpriteAnimator } from "../../src/particles/SpriteAnimator";

/**
 * Create Animated Particle.
 *
 * @param loop - Loop Flag
 * @returns Particle
 */
function animated(loop: boolean): Particle {
  const particle = new Particle();
  particle.frameCount = 4;
  particle.frameDuration = 100;
  particle.frameLoop = loop;
  return particle;
}

describe("SpriteAnimator", () => {
  it("advances frames by elapsed time and loops", () => {
    const particle = animated(true);

    SpriteAnimator.advance(particle, 250);
    expect(particle.frameIndex).toBe(2);
    SpriteAnimator.advance(particle, 200);
    expect(particle.frameIndex).toBe(0);
  });

  it("holds the last frame without loop", () => {
    const particle = animated(false);

    SpriteAnimator.advance(particle, 1000);
    expect(particle.frameIndex).toBe(3);
  });
});
