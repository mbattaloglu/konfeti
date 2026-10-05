import type { ResolvedSpriteShape } from "../../types/resolved/ResolvedShape";
import { RangeUtils } from "../../utils/RangeUtils";
import { SpriteShape } from "../concretes/SpriteShape";

/**
 * Static Spritesheet Shape Builder and Spawner.
 */
export class SpriteSpawner {
  /**
   * Milliseconds per Second.
   */
  private static readonly MS_PER_SECOND = 1000;

  /**
   * Attach Spawn Function to Resolved Sprite Data.
   *
   * @param data - Resolved Sprite Data
   * @returns Spawnable Resolved Sprite Shape
   */
  public static create(data: Omit<ResolvedSpriteShape, "spawn">): ResolvedSpriteShape {
    const shape: ResolvedSpriteShape = {
      ...data,
      spawn: (particle, random, scale, colorIndex) => {
        const frameCount =
          shape.frames.kind === "grid" ? shape.frames.count : shape.frames.rects.length;
        const fps = RangeUtils.sample(shape.fps, random);

        particle.shape = SpriteShape.getInstance();
        // a tinted sheet draws the copy in the particle's color
        particle.image =
          shape.tinted.length > 0
            ? (shape.tinted[colorIndex % shape.tinted.length] ?? shape.source)
            : shape.source;
        particle.frames = shape.frames;
        particle.frameCount = frameCount;
        particle.frameIndex = shape.randomStartFrame ? Math.floor(random.next() * frameCount) : 0;
        particle.frameElapsed = 0;
        particle.frameDuration = fps > 0 ? SpriteSpawner.MS_PER_SECOND / fps : 0;
        particle.frameLoop = shape.loop;
        particle.width = Math.max(0, RangeUtils.sample(shape.size, random)) * scale;
        particle.height = particle.width;
      },
    };

    return shape;
  }
}
