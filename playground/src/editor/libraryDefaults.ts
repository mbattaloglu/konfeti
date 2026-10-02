// the one playground module that deep-imports the library's `config/` tables: control initials and the builder's
// default comparisons are the library defaults by construction, so a changed library default changes the editor too
import type { EasingName } from "konfeti";

export {
  DEFAULT_ATTRACT,
  DEFAULT_FIRE_OPTIONS,
  DEFAULT_FLOOR,
  DEFAULT_ORIGIN,
  DEFAULT_PHYSICS,
  DEFAULT_SWIRL,
} from "../../../packages/konfeti/src/config/FireDefaults";
export {
  DEFAULT_FORMATION,
  DEFAULT_FORMATION_FONT,
  DEFAULT_FORMATION_RELEASE_VELOCITY,
  DEFAULT_IMAGE_COLORS,
  FORMATION_MIN_FIT,
} from "../../../packages/konfeti/src/config/FormationDefaults";
export {
  DEFAULT_FADE_OUT,
  DEFAULT_FLIP,
  DEFAULT_GRADIENT_ANGLE,
  DEFAULT_PALETTE,
  DEFAULT_PAPER_GEOMETRY,
  DEFAULT_SHADOW,
  DEFAULT_STROKE_WIDTH,
  DEFAULT_STYLE,
  DEFAULT_TRAIL,
  DEFAULT_WOBBLE,
  MAX_SKEW_DEGREES,
  TRAIL_LENGTH_LIMITS,
} from "../../../packages/konfeti/src/config/PaperDefaults";
export {
  BITMAP_DEFAULTS,
  VECTOR_DEFAULTS,
} from "../../../packages/konfeti/src/config/ShapeDefaults";

/**
 * Default Shape Weight.
 * Mirrors the literal fallback of `entry.weight ?? 1` (`core/resolve/ShapeResolver.ts`), which has no config entry.
 */
export const DEFAULT_SHAPE_WEIGHT = 1;

/**
 * Default Easing of Color over Life and Scale over Life.
 * Mirrors the literal `"linear"` fallbacks in `core/resolve/StyleResolver.ts`, which have no config entry.
 */
export const DEFAULT_LIFE_EASING: EasingName = "linear";

/**
 * Radius of a Corner a Per-Corner `cornerRadius` Leaves Out.
 * Mirrors the literal `[0, 0]` fallback in `shapes/handlers/paperShape.ts`.
 */
export const OMITTED_CORNER_RADIUS = 0;
