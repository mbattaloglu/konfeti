import type { Milliseconds } from "./Units";

/**
 * Emission Timing.
 * - `"burst"` — all `particleCount` particles at once (default).
 * - `"stream"` — `particleCount` particles spread evenly over `duration` (a continuous fountain).
 * - `"interval"` — `particleCount` particles every `every` ms, `times` times. The origin is re-sampled for
 *   each shot, so ranged origins produce fireworks at different spots.
 *
 * @example
 * ```ts
 * emission: { mode: "stream", duration: 3000 }
 * emission: { mode: "interval", every: 400, times: 6 }
 * ```
 */
export type EmissionOptions =
  | {
      /**
       * Emission Mode.
       */
      readonly mode: "burst";
    }
  | {
      /**
       * Emission Mode.
       */
      readonly mode: "stream";
      /**
       * Stream Duration.
       */
      readonly duration: Milliseconds;
    }
  | {
      /**
       * Emission Mode.
       */
      readonly mode: "interval";
      /**
       * Time between Shots.
       */
      readonly every: Milliseconds;
      /**
       * Number of Shots.
       */
      readonly times: number;
    };
