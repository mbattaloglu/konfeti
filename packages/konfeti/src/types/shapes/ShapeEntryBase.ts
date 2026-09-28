import type { ShapeStyle } from "../ShapeStyle";

/**
 * Fields Shared by Every `shapes` Entry.
 * Style keys override the `paper` base style for this shape only.
 */
export type ShapeEntryBase = ShapeStyle & {
  /**
   * Relative Share of Particles.
   * With `shapes: [{ type: "star", weight: 3 }, { type: "paper" }]` three quarters of the particles are stars.
   * Must be `> 0`.
   *
   * @defaultValue `1`
   */
  readonly weight?: number;
};
