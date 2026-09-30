import { describe, expect, it } from "vitest";

import type { AttractOptions } from "../../src/types/AttractOptions";
import { WorkerOptionsPreparer } from "../../src/worker/WorkerOptionsPreparer";

/**
 * Pick the Followed Attractor Target from Layers.
 *
 * @param layers - Attract Values, Lowest Priority First
 * @returns Followed Target
 */
function followed(layers: readonly (boolean | AttractOptions | undefined)[]): unknown {
  return WorkerOptionsPreparer.followedAttractTarget(layers);
}

describe("WorkerOptionsPreparer.followedAttractTarget", () => {
  it("merges attract layers the way the resolver does", () => {
    const basket = document.createElement("div");

    expect(followed([undefined, undefined])).toBeNull();
    expect(followed([true, undefined])).toBe("pointer");
    expect(followed([false, { strength: 100 }])).toBe("pointer");
    expect(followed([{ target: basket }, true])).toBe(basket);
    expect(followed([{ target: basket }, { strength: 100 }])).toBe(basket);
    expect(followed([{ target: basket }, false])).toBeNull();
  });

  it("follows nothing for a fixed point", () => {
    expect(followed([true, { target: { x: 0.5, y: 0 } }])).toBeNull();
  });
});
