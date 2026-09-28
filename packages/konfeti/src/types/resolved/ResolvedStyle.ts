import type { EasingFunction } from "../Easing";
import type { FlipAxis } from "../FlipAxis";
import type { RangeTuple } from "../Range";
import type { ResolvedPalette } from "./ResolvedPalette";

/**
 * Fully Resolved Common Style.
 * Angles are still degrees; ranges are normalized tuples; disabled effects are `null`.
 */
export type ResolvedStyle = {
  /**
   * Scale Range.
   */
  readonly scale: RangeTuple;
  /**
   * Front Palette.
   */
  readonly palette: ResolvedPalette;
  /**
   * Back Palette (`null` uses shaded front colors).
   */
  readonly backPalette: ResolvedPalette | null;
  /**
   * Gradient Settings (`null` disables gradient).
   */
  readonly gradient: { readonly colors: readonly string[]; readonly angle: number } | null;
  /**
   * Color-over-Life Lookup Tables per Palette Color (`null` disables it).
   */
  readonly colorOverLife: {
    readonly tables: readonly (readonly string[])[];
    readonly easing: EasingFunction;
  } | null;
  /**
   * Stroke Settings (`null` disables stroke).
   */
  readonly stroke: { readonly color: string; readonly width: RangeTuple } | null;
  /**
   * Opacity Range.
   */
  readonly opacity: RangeTuple;
  /**
   * Fade-In Fraction.
   */
  readonly fadeIn: number;
  /**
   * Fade-Out Settings (`null` disables fading).
   */
  readonly fadeOut: { readonly start: number; readonly easing: EasingFunction } | null;
  /**
   * Scale-over-Life Settings (`null` disables it).
   */
  readonly scaleOverLife: { readonly to: number; readonly easing: EasingFunction } | null;
  /**
   * Initial Rotation Range in Degrees.
   */
  readonly rotation: RangeTuple;
  /**
   * Rotation Speed Range in Degrees per Second.
   */
  readonly rotationSpeed: RangeTuple;
  /**
   * Flip Settings (`null` disables flip).
   */
  readonly flip: { readonly frequency: RangeTuple; readonly axis: FlipAxis } | null;
  /**
   * Wobble Settings (`null` disables wobble).
   */
  readonly wobble: { readonly amplitude: RangeTuple; readonly frequency: RangeTuple } | null;
  /**
   * Tilt Amplitude Range in Degrees.
   */
  readonly tilt: RangeTuple;
  /**
   * Shadow Settings (`null` disables shadow).
   */
  readonly shadow: {
    readonly color: string;
    readonly blur: number;
    readonly offsetX: number;
    readonly offsetY: number;
  } | null;
  /**
   * Shine Strength.
   */
  readonly shine: number;
  /**
   * Canvas Blend Mode.
   */
  readonly blendMode: GlobalCompositeOperation;
};
