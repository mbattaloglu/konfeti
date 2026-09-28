import type { Range } from "./Range";
import type { Pixels } from "./Units";

/**
 * Per-Corner Radius Map.
 * Omitted corners stay sharp (`0`).
 */
export type CornerRadii = {
  /**
   * Top-Left Corner Radius.
   */
  readonly tl?: Range<Pixels>;
  /**
   * Top-Right Corner Radius.
   */
  readonly tr?: Range<Pixels>;
  /**
   * Bottom-Right Corner Radius.
   */
  readonly br?: Range<Pixels>;
  /**
   * Bottom-Left Corner Radius.
   */
  readonly bl?: Range<Pixels>;
};

/**
 * Corner Radius for All Corners or per Corner.
 * A number (or range) rounds every corner equally; a {@link CornerRadii} object sets each corner separately.
 * Radii are clamped to half of the particle's shorter side.
 */
export type CornerRadius = Range<Pixels> | CornerRadii;
