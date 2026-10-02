import { describe, expect, it } from "vitest";

import { initialBurst, MAX_BURSTS, normalizeBurst } from "../src/editor/burstState";
import type { BurstState } from "../src/editor/burstState";
import {
  addBurst,
  appendBursts,
  createTabs,
  currentBursts,
  duplicateBurst,
  patchBursts,
  removeBurst,
  selectBurst,
} from "../src/editor/burstTabs";
import type { BurstTabs } from "../src/editor/burstTabs";

/**
 * Burst with One Particle Count, to Tell Bursts Apart.
 *
 * @param count - Particle Count
 * @returns Burst State
 */
function burst(count: number): BurstState {
  return normalizeBurst({ particleCount: count });
}

/**
 * Read the Particle Counts of a Tab List.
 *
 * @param bursts - Burst States
 * @returns Particle Counts in Tab Order
 */
function counts(bursts: readonly BurstState[]): unknown[] {
  return bursts.map((item) => item["particleCount"]);
}

describe("burst tabs", () => {
  it("store the live state when switching, and show the picked tab", () => {
    const tabs: BurstTabs = { bursts: [burst(1), burst(2)], active: 0 };
    const switched = selectBurst(tabs, burst(10), 1);

    expect(switched.active).toBe(1);
    expect(counts(switched.bursts)).toEqual([10, 2]);
    expect(counts(currentBursts(switched, burst(20)))).toEqual([10, 20]);
  });

  it("add, duplicate and remove around the active tab", () => {
    const one = createTabs([burst(1)], initialBurst());
    const two = addBurst(one, burst(5), burst(2));

    expect(two.active).toBe(1);
    expect(counts(two.bursts)).toEqual([5, 2]);

    const copied = duplicateBurst(selectBurst(two, burst(2), 0), burst(5));
    expect(copied.active).toBe(1);
    expect(counts(copied.bursts)).toEqual([5, 5, 2]);

    // removing the last tab selects the new last one; with one tab left nothing changes
    const last = removeBurst({ ...copied, active: 2 });
    expect(last.active).toBe(1);
    expect(counts(last.bursts)).toEqual([5, 5]);
    expect(removeBurst(createTabs([burst(1)], initialBurst())).bursts).toHaveLength(1);
  });

  it("append several bursts after the stored ones and select the first new one", () => {
    const tabs = createTabs([burst(1), burst(2)], initialBurst());
    const appended = appendBursts(tabs, burst(10), [burst(3), burst(4)]);

    expect(counts(appended.bursts)).toEqual([10, 2, 3, 4]);
    expect(appended.active).toBe(2);

    // only as many as fit; none fit: unchanged
    const nearlyFull = createTabs(
      Array.from({ length: MAX_BURSTS - 1 }, () => burst(1)),
      initialBurst(),
    );
    expect(appendBursts(nearlyFull, burst(1), [burst(5), burst(6)]).bursts).toHaveLength(
      MAX_BURSTS,
    );
    const full = appendBursts(nearlyFull, burst(1), [burst(5)]);
    expect(appendBursts(full, burst(1), [burst(7)])).toBe(full);
  });

  it("stop at the most bursts the editor keeps", () => {
    const full = createTabs(
      Array.from({ length: MAX_BURSTS }, (_unused, index) => burst(index)),
      initialBurst(),
    );

    expect(addBurst(full, burst(0), burst(99))).toBe(full);
    expect(duplicateBurst(full, burst(0))).toBe(full);
    expect(
      createTabs(
        Array.from({ length: MAX_BURSTS + 3 }, () => burst(1)),
        initialBurst(),
      ).bursts,
    ).toHaveLength(MAX_BURSTS);
    expect(createTabs([], burst(7)).bursts).toEqual([burst(7)]);
  });

  it("patch only stored bursts that match, never the live one", () => {
    const tabs: BurstTabs = {
      bursts: [
        normalizeBurst({ "image.upload": "blob:a" }),
        normalizeBurst({ "image.upload": "blob:a" }),
        normalizeBurst({ "image.upload": "blob:b" }),
      ],
      active: 0,
    };
    const patched = patchBursts(tabs, (item) => item["image.upload"] === "blob:a", {
      "image.src": "upload",
    });

    expect(patched.bursts.map((item) => item["image.src"])).toEqual([
      "demo canvas",
      "upload",
      "demo canvas",
    ]);
  });
});
