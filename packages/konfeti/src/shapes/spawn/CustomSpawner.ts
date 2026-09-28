import type { ResolvedCustomShape } from "../../types/resolved/ResolvedShape";
import { RangeUtils } from "../../utils/RangeUtils";
import { CustomShape } from "../concretes/CustomShape";

/**
 * Static Draw-Based Custom Shape Builder and Spawner.
 */
export class CustomSpawner {
  /**
   * Attach Spawn Function to Resolved Custom Data.
   *
   * @param data - Resolved Custom Data
   * @returns Spawnable Resolved Custom Shape
   */
  public static create(data: Omit<ResolvedCustomShape, "spawn">): ResolvedCustomShape {
    const shape: ResolvedCustomShape = {
      ...data,
      spawn: (particle, random, scale) => {
        particle.shape = CustomShape.getInstance();
        particle.custom = shape;
        particle.width = Math.max(0, RangeUtils.sample(shape.size, random)) * scale;
        particle.height = particle.width * shape.aspect;
      },
    };

    return shape;
  }
}
