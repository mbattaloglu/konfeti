/**
 * Built-in Easing Name.
 */
export type EasingName =
  | "linear"
  | "easeInQuad"
  | "easeOutQuad"
  | "easeInOutQuad"
  | "easeInCubic"
  | "easeOutCubic"
  | "easeInOutCubic";

/**
 * Custom Easing Function.
 * Receives progress `t` in `0–1` and returns the eased progress (usually `0–1`).
 */
export type EasingFunction = (t: number) => number;

/**
 * Easing Name or Custom Easing Function.
 *
 * @example
 * ```ts
 * easing: "easeOutCubic"
 * easing: (t) => t * t * t
 * ```
 */
export type Easing = EasingName | EasingFunction;
