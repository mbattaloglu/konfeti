import { describe, expect, it } from "vitest";

import { Random } from "../../src/utils/Random";

describe("Random", () => {
  it("produces identical sequences for identical seeds", () => {
    const a = new Random(42);
    const b = new Random(42);
    const sequenceA = Array.from({ length: 5 }, () => a.next());
    const sequenceB = Array.from({ length: 5 }, () => b.next());

    expect(sequenceA).toEqual(sequenceB);
  });

  it("produces different sequences for different seeds", () => {
    expect(new Random(1).next()).not.toBe(new Random(2).next());
  });

  it("stays inside [0, 1) and [min, max)", () => {
    const random = new Random(7);

    for (let index = 0; index < 1000; index++) {
      const value = random.next();
      const bounded = random.between(10, 20);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      expect(bounded).toBeGreaterThanOrEqual(10);
      expect(bounded).toBeLessThan(20);
    }
  });
});
