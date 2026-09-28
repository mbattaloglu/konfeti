import { DEFAULT_PAPER_GEOMETRY, MAX_SKEW_DEGREES } from "../../config/PaperDefaults";
import { ResolveUtils } from "../../core/resolve/ResolveUtils";
import type { CornerRadii, CornerRadius } from "../../types/CornerRadius";
import type { PaperGeometry } from "../../types/PaperGeometry";
import type { Range, RangeTuple } from "../../types/Range";
import type { ResolvedPaperShape } from "../../types/resolved/ResolvedShape";
import type { PaperShapeOptions } from "../../types/shapes/PaperShapeOptions";
import type { ShapeHandler } from "../../types/shapes/ShapeHandler";
import { MathUtils } from "../../utils/MathUtils";
import { RangeUtils } from "../../utils/RangeUtils";
import { WeightedListUtils } from "../../utils/WeightedListUtils";
import { PaperSpawner } from "../spawn/PaperSpawner";

/**
 * Resolve Corner Radius into Per-Corner Tuples.
 *
 * @param radius - Public Corner Radius
 * @param name - Option Path for Error Messages
 * @returns Tuples in `tl, tr, br, bl` Order
 */
function resolveCornerRadius(
  radius: CornerRadius,
  name: string,
): ResolvedPaperShape["cornerRadius"] {
  const isPerCorner =
    typeof radius === "object" && !Array.isArray(radius) && !("min" in radius && "max" in radius);

  if (!isPerCorner) {
    const all = RangeUtils.toTuple(radius as Range, `${name}.cornerRadius`);
    return [all, all, all, all];
  }

  const corners = radius as CornerRadii;
  const corner = (key: keyof CornerRadii): RangeTuple => {
    const value = corners[key];
    return value === undefined ? [0, 0] : RangeUtils.toTuple(value, `${name}.cornerRadius.${key}`);
  };

  return [corner("tl"), corner("tr"), corner("br"), corner("bl")];
}

/**
 * Default Paper Shape Handler.
 * Always registered — it is the shape used when `shapes` is omitted.
 */
export const paperShape: ShapeHandler<PaperShapeOptions> = {
  type: "paper",
  resolve: (entry, { style, paperLayers, name }) => {
    const all: readonly (PaperGeometry | undefined)[] = [
      DEFAULT_PAPER_GEOMETRY,
      ...paperLayers,
      entry,
    ];
    const value = <K extends keyof typeof DEFAULT_PAPER_GEOMETRY>(
      key: K,
    ): NonNullable<PaperGeometry[K]> | (typeof DEFAULT_PAPER_GEOMETRY)[K] =>
      ResolveUtils.pick(all, key) ?? DEFAULT_PAPER_GEOMETRY[key];
    const aspectRatio = ResolveUtils.pick(all, "aspectRatio");
    const skew = RangeUtils.toTuple(value("skew"), `${name}.skew`);
    const ratio =
      aspectRatio === undefined ? null : RangeUtils.toTuple(aspectRatio, `${name}.aspectRatio`);

    if (ratio !== null && ratio[0] <= 0) {
      throw new TypeError(`konfeti: "${name}.aspectRatio" must be greater than 0`);
    }

    return PaperSpawner.create({
      kind: "paper",
      style,
      forms: WeightedListUtils.build(WeightedListUtils.entries(value("form")), `${name}.form`),
      width: RangeUtils.toTuple(value("width"), `${name}.width`),
      height: RangeUtils.toTuple(value("height"), `${name}.height`),
      aspectRatio: ratio,
      cornerRadius: resolveCornerRadius(value("cornerRadius"), name),
      skew: [
        MathUtils.clamp(skew[0], -MAX_SKEW_DEGREES, MAX_SKEW_DEGREES),
        MathUtils.clamp(skew[1], -MAX_SKEW_DEGREES, MAX_SKEW_DEGREES),
      ],
    });
  },
};
