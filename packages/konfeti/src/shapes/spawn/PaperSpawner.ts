import type { Particle } from "../../particles/Particle";
import type { ResolvedPaperShape } from "../../types/resolved/ResolvedShape";
import { MathUtils } from "../../utils/MathUtils";
import type { Random } from "../../utils/Random";
import { RangeUtils } from "../../utils/RangeUtils";
import { WeightedListUtils } from "../../utils/WeightedListUtils";
import { PaperShape } from "../concretes/PaperShape";

/**
 * Static Paper Shape Builder and Spawner.
 */
export class PaperSpawner {
  /**
   * Attach Spawn Function to Resolved Paper Data.
   *
   * @param data - Resolved Paper Data
   * @returns Spawnable Resolved Paper Shape
   */
  public static create(data: Omit<ResolvedPaperShape, "spawn">): ResolvedPaperShape {
    const shape: ResolvedPaperShape = {
      ...data,
      spawn: (particle, random, scale) => {
        PaperSpawner.spawn(particle, shape, random, scale);
      },
    };

    return shape;
  }

  /**
   * Spawn Paper Geometry.
   *
   * @param particle - Target Particle
   * @param shape - Resolved Paper Shape
   * @param random - Burst Random Generator
   * @param scale - Sampled Size Multiplier
   */
  private static spawn(
    particle: Particle,
    shape: ResolvedPaperShape,
    random: Random,
    scale: number,
  ): void {
    const form = WeightedListUtils.pick(shape.forms, random);
    const width = Math.max(0, RangeUtils.sample(shape.width, random)) * scale;
    const height =
      form === "square"
        ? width
        : shape.aspectRatio === null
          ? Math.max(0, RangeUtils.sample(shape.height, random)) * scale
          : width * RangeUtils.sample(shape.aspectRatio, random);

    particle.shape = PaperShape.getInstance();
    particle.form = form;
    particle.width = width;
    particle.height = height;
    particle.skewTan = Math.tan(RangeUtils.sample(shape.skew, random) * MathUtils.DEG_TO_RAD);
    PaperSpawner.spawnCorners(particle, shape, random, scale);
  }

  /**
   * Spawn Corner Radii for Current Form.
   *
   * @param particle - Target Particle (width, height and form already set)
   * @param shape - Resolved Paper Shape
   * @param random - Burst Random Generator
   * @param scale - Sampled Size Multiplier
   */
  private static spawnCorners(
    particle: Particle,
    shape: ResolvedPaperShape,
    random: Random,
    scale: number,
  ): void {
    const shortSide = Math.min(particle.width, particle.height);
    const radii = particle.radii;

    switch (particle.form) {
      case "circle":
        radii.fill(0);
        break;
      case "strip":
        radii.fill(shortSide / 2);
        break;
      case "leaf":
        // opposite corners may use the full short side: adjacent radii still fit (r + 0 ≤ side)
        radii[0] = shortSide;
        radii[1] = 0;
        radii[2] = shortSide;
        radii[3] = 0;
        break;
      case "rect":
      case "square":
        for (let corner = 0; corner < radii.length; corner++) {
          const range = shape.cornerRadius[corner] ?? shape.cornerRadius[0];
          radii[corner] = MathUtils.clamp(
            RangeUtils.sample(range, random) * scale,
            0,
            shortSide / 2,
          );
        }
        break;
    }

    particle.isRounded = particle.form !== "circle" && radii.some((radius) => radius > 0);
  }
}
