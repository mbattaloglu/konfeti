import type { ClientPoint, FireInput, FireOptions } from "konfeti";

import { isBurstList } from "../jsonIO";

/**
 * Number of Possible Seeds (unsigned 32-bit).
 */
const SEED_RANGE = 2 ** 32;

/**
 * Give Every Entry of a Burst List Its Own Seed, so the List Can Be Replayed Exactly.
 * A single burst keeps its options: its handle reports the seed it picked.
 *
 * @param input - Fire Input
 * @returns Fire Input with Seeded List Entries
 */
export function seedList(input: FireInput): FireInput {
  return isBurstList(input)
    ? input.map((entry) =>
        entry.seed === undefined
          ? { ...entry, seed: Math.floor(Math.random() * SEED_RANGE) }
          : entry,
      )
    : input;
}

/**
 * Place Every Entry without an Origin at a Click Point.
 * What `onClick` does with the options it fires, so a replay fires at the same spot.
 *
 * @param input - Fire Input
 * @param point - Click Point (client pixels)
 * @returns Fire Input with the Click Origin on Every Entry that Had None
 */
export function withClickOrigin(input: FireInput, point: ClientPoint): FireInput {
  const place = (entry: FireOptions): FireOptions =>
    entry.origin === undefined ? { ...entry, origin: point } : entry;

  return isBurstList(input) ? input.map(place) : place(input);
}
