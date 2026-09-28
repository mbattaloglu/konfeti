import type { Range } from "../../types/Range";
import type { ResolvedStyle } from "../../types/resolved/ResolvedStyle";
import type { ResolvedVectorShape, VectorVariant } from "../../types/resolved/ResolvedShape";
import { RangeUtils } from "../../utils/RangeUtils";
import { WeightedListUtils } from "../../utils/WeightedListUtils";
import { VectorShape } from "../concretes/VectorShape";

/**
 * Static Vector Shape Builder and Spawner.
 * Shared by star, triangle, polygon, heart, ribbon, path and path-based custom shapes.
 */
export class VectorSpawner {
  /**
   * Build Spawnable Vector Shape.
   *
   * @param style - Resolved Style
   * @param size - Size Range
   * @param variants - Weighted Path Variants
   * @param name - Option Path for Error Messages
   * @returns Resolved Vector Shape
   */
  public static create(
    style: ResolvedStyle,
    size: Range,
    variants: readonly { readonly value: VectorVariant; readonly weight: number }[],
    name: string,
  ): ResolvedVectorShape {
    const shape: ResolvedVectorShape = {
      kind: "vector",
      style,
      size: RangeUtils.toTuple(size, `${name}.size`),
      variants: WeightedListUtils.build(variants, name),
      spawn: (particle, random, scale) => {
        const variant = WeightedListUtils.pick(shape.variants, random);

        particle.shape = VectorShape.getInstance();
        particle.width = Math.max(0, RangeUtils.sample(shape.size, random)) * scale;
        particle.height = particle.width * variant.aspect;
        particle.path = variant.path;
        particle.pathScale = variant.scale;
        particle.pathOffsetX = variant.offsetX;
        particle.pathOffsetY = variant.offsetY;
      },
    };

    return shape;
  }

  /**
   * Wrap Variants with Equal Weights.
   *
   * @param variants - Path Variants
   * @returns Weighted Entries
   */
  public static equal(
    variants: readonly VectorVariant[],
  ): { value: VectorVariant; weight: number }[] {
    return variants.map((value) => ({ value, weight: 1 }));
  }
}
