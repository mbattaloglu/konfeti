import type { FormationBase } from "../types/formation/FormationBase";

/**
 * Default Formation Settings.
 */
export const DEFAULT_FORMATION = {
  mode: "assemble",
  assemble: 900,
  hold: 1000,
  easing: "easeOutCubic",
  spacing: 8,
  fit: 0.9,
} as const satisfies Required<FormationBase>;

/**
 * Default Burst-Apart Speed of Formations (used when `startVelocity` is not set), in px/s.
 * Much gentler than a launch, so the pieces spread out and flutter down instead of leaving the screen.
 */
export const DEFAULT_FORMATION_RELEASE_VELOCITY = [300, 700] as const;

/**
 * Default Font of Text Formations.
 */
export const DEFAULT_FORMATION_FONT = "900 96px sans-serif";

/**
 * Default for Painting Particles with the Image's Colors.
 */
export const DEFAULT_IMAGE_COLORS = true;

/**
 * Smallest Allowed `fit` Ratio.
 */
export const FORMATION_MIN_FIT = 0.05;

/**
 * Alpha from which a Mask Pixel Belongs to the Shape (0–255, about half opaque).
 */
export const FORMATION_ALPHA_THRESHOLD = 128;

/**
 * Random Offset of Each Grid Point, as a Share of the Spacing (hides the grid).
 */
export const FORMATION_JITTER = 0.5;

/**
 * Longest Random Start Delay, as a Share of the Fly-In Time.
 */
export const FORMATION_STAGGER = 0.35;

/**
 * Distance beyond the Canvas Edges where Assembling Particles Start, as a Share of the Longer Side.
 */
export const FORMATION_EDGE_MARGIN = 0.08;

/**
 * Random Spread of the Burst-Apart Direction around "Straight Outward", in Degrees.
 */
export const FORMATION_RELEASE_SPREAD = 40;

/**
 * Largest Mask Area in Pixels (larger shapes are read at a lower resolution).
 */
export const FORMATION_MAX_MASK_PIXELS = 1_000_000;

/**
 * Padding around Rendered Text in Mask Pixels.
 */
export const FORMATION_TEXT_PADDING = 2;
