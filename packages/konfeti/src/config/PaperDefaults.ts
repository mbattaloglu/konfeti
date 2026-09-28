import type { ColorInput } from "../types/ColorInput";
import type { FadeOutOptions } from "../types/FadeOutOptions";
import type { FlipOptions } from "../types/FlipOptions";
import type { PaperGeometry } from "../types/PaperGeometry";
import type { ShadowOptions } from "../types/ShadowOptions";
import type { ShapeStyle } from "../types/ShapeStyle";
import type { WobbleOptions } from "../types/WobbleOptions";

/**
 * Default Front Color Palette.
 * The classic canvas-confetti colors, so the default burst looks familiar.
 */
export const DEFAULT_PALETTE = [
  "#26ccff",
  "#a25afd",
  "#ff5e7e",
  "#88ff5a",
  "#fcff42",
  "#ffa62d",
  "#ff36ff",
] as const satisfies readonly ColorInput[];

/**
 * Default Flip Settings (used when `flip` is `true` or partially set).
 */
export const DEFAULT_FLIP = {
  frequency: [0.6, 1.8],
  axis: "x",
} as const satisfies Required<FlipOptions>;

/**
 * Default Wobble Settings (used when `wobble` is `true` or partially set).
 */
export const DEFAULT_WOBBLE = {
  amplitude: [2, 8],
  frequency: [0.4, 1.2],
} as const satisfies Required<WobbleOptions>;

/**
 * Default Fade-Out Settings (used when `fadeOut` is `true` or partially set).
 */
export const DEFAULT_FADE_OUT = {
  start: 0.7,
  easing: "linear",
} as const satisfies Required<FadeOutOptions>;

/**
 * Default Shadow Settings (merged under a partial `shadow` object).
 */
export const DEFAULT_SHADOW = {
  color: "rgba(0,0,0,0.25)",
  blur: 4,
  offsetX: 0,
  offsetY: 2,
} as const satisfies Required<ShadowOptions>;

/**
 * Default Stroke Width.
 */
export const DEFAULT_STROKE_WIDTH = 1;

/**
 * Default Gradient Angle in Degrees.
 */
export const DEFAULT_GRADIENT_ANGLE = 90;

/**
 * Color-over-Life Lookup Table Resolution.
 */
export const COLOR_OVER_LIFE_STEPS = 24;

/**
 * Default Common Style.
 * Every `ShapeStyle` key; `false` means "off" for optional effects.
 */
export const DEFAULT_STYLE = {
  scale: 1,
  colors: DEFAULT_PALETTE,
  colorMode: "random",
  backColor: "auto",
  backShade: 0.3,
  gradient: false,
  colorOverLife: false,
  stroke: false,
  opacity: 1,
  fadeIn: 0,
  fadeOut: true,
  scaleOverLife: false,
  rotation: [0, 360],
  rotationSpeed: [-240, 240],
  flip: true,
  wobble: true,
  tilt: 0,
  shadow: false,
  shine: 0,
  blendMode: "source-over",
} as const satisfies Required<ShapeStyle>;

/**
 * Default Paper Geometry.
 * Every `PaperGeometry` key except `aspectRatio` (which is "unset" by default).
 */
export const DEFAULT_PAPER_GEOMETRY = {
  width: [6, 10],
  height: [10, 16],
  form: "rect",
  cornerRadius: 0,
  skew: 0,
} as const satisfies Required<Omit<PaperGeometry, "aspectRatio">>;

/**
 * Maximum Absolute Skew in Degrees.
 */
export const MAX_SKEW_DEGREES = 60;
