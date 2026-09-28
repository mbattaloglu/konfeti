/**
 * Color Pick Strategy.
 * - `"random"` — each particle picks a random color; `weight` values are respected.
 * - `"sequence"` — colors are used in list order, looping (particle 1 → color 1, particle 2 → color 2 …).
 *   Weights are ignored.
 */
export type ColorMode = "random" | "sequence";
