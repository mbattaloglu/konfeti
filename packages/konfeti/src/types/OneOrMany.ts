import type { Weighted } from "./Weighted";

/**
 * Single Value or Weighted Pick List.
 * With a list, each particle picks one entry at random (respecting weights).
 *
 * @example
 * ```ts
 * emoji: "🎉"
 * emoji: ["🎉", "🥳", { value: "✨", weight: 3 }]
 * ```
 */
export type OneOrMany<T> = T | readonly (T | Weighted<T>)[];
