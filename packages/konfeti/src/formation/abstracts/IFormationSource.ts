import type { FormationMask } from "../types/FormationMask";

/**
 * Formation Source Contract: where a shape's pixels come from (text or an image).
 */
export type IFormationSource = {
  /**
   * Check Whether the Pixels Can Be Read (a web font or an image may still be loading).
   *
   * @returns Ready Flag
   */
  isReady(): boolean;
  /**
   * Check Whether the Source Failed (the burst then ends without particles).
   *
   * @returns Failed Flag
   */
  hasFailed(): boolean;
  /**
   * Return the Shape's Pixels (rendered once, on the first call after it is ready).
   *
   * @returns Mask, or Null when the Pixels Cannot Be Read
   */
  getMask(): FormationMask | null;
};
