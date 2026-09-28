// tightly related unit aliases share one file on purpose: they only exist to document intent.

/**
 * Length in CSS Pixels.
 * Measured before `devicePixelRatio` scaling, so `10` looks the same size on every screen.
 */
export type Pixels = number;

/**
 * Angle in Degrees.
 * `0` points right, `90` points up, `180` points left, `270` points down.
 */
export type Degrees = number;

/**
 * Duration in Milliseconds.
 */
export type Milliseconds = number;

/**
 * Normalized Value between `0` and `1`.
 * Values outside the range are clamped.
 */
export type Ratio = number;

/**
 * Unitless Multiplier.
 * `1` keeps the original value, `2` doubles it, `0.5` halves it.
 */
export type Multiplier = number;

/**
 * Frequency in Cycles per Second.
 * `1` completes one full cycle (e.g. one full flip) every second.
 */
export type Hertz = number;

/**
 * Speed in CSS Pixels per Second.
 */
export type PixelsPerSecond = number;

/**
 * Acceleration in CSS Pixels per Second Squared.
 */
export type PixelsPerSecondSquared = number;

/**
 * Angular Speed in Degrees per Second.
 */
export type DegreesPerSecond = number;

/**
 * Exponential Decay Rate per Second.
 * Velocity is multiplied by `e^(-rate × seconds)`; `0` means no slowdown, higher values stop particles sooner.
 */
export type PerSecond = number;
