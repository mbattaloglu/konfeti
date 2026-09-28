import type { CornerRadius } from "./CornerRadius";
import type { OneOrMany } from "./OneOrMany";
import type { PaperForm } from "./PaperForm";
import type { Range } from "./Range";
import type { Degrees, Multiplier, Pixels } from "./Units";

/**
 * Paper-Only Geometry.
 */
export type PaperGeometry = {
  /**
   * Paper Width.
   *
   * @defaultValue `[6, 10]`
   */
  readonly width?: Range<Pixels>;
  /**
   * Paper Height.
   * Ignored when `aspectRatio` is set or the picked form is `"square"`.
   *
   * @defaultValue `[10, 16]`
   */
  readonly height?: Range<Pixels>;
  /**
   * Height-to-Width Ratio.
   * When set, height is `width × aspectRatio` instead of `height`. Values `≤ 0` are rejected.
   *
   * @defaultValue `undefined` (use `height`)
   * @example
   * ```ts
   * paper: { width: [6, 12], aspectRatio: 1.6 }
   * ```
   */
  readonly aspectRatio?: Range<Multiplier>;
  /**
   * Paper Silhouette(s).
   * A single form, or a list — each particle picks one (weights supported).
   *
   * @defaultValue `"rect"`
   * @example
   * ```ts
   * paper: { form: ["rect", "circle", { value: "strip", weight: 2 }] }
   * ```
   * @see {@link PaperForm}
   */
  readonly form?: OneOrMany<PaperForm>;
  /**
   * Corner Radius.
   * Rounds `"rect"` and `"square"` corners. A number rounds all corners; an object sets each corner.
   * Clamped to half of the shorter side.
   *
   * @defaultValue `0`
   * @example
   * ```ts
   * paper: { cornerRadius: 3 }
   * paper: { cornerRadius: { tl: 6, br: 6 } }
   * ```
   */
  readonly cornerRadius?: CornerRadius;
  /**
   * Horizontal Skew.
   * Slants the piece into a parallelogram for a hand-cut look. Clamped to `-60…60`.
   *
   * @defaultValue `0`
   */
  readonly skew?: Range<Degrees>;
};
