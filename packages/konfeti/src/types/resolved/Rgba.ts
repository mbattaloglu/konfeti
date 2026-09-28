/**
 * Parsed RGBA Color.
 * Channels `r`, `g`, `b` in `0–255`, alpha `a` in `0–1`.
 */
export type Rgba = {
  /**
   * Red Channel.
   */
  readonly r: number;
  /**
   * Green Channel.
   */
  readonly g: number;
  /**
   * Blue Channel.
   */
  readonly b: number;
  /**
   * Alpha Channel.
   */
  readonly a: number;
};
