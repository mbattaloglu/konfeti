import { describe, expect, it } from "vitest";

import { Random } from "../../src/utils/Random";
import { WeightedListUtils } from "../../src/utils/WeightedListUtils";

describe("WeightedListUtils", () => {
  it("normalizes single values, plain lists and weighted entries", () => {
    expect(WeightedListUtils.entries("a")).toEqual([{ value: "a", weight: 1 }]);
    expect(WeightedListUtils.entries(["a", { value: "b", weight: 4 }])).toEqual([
      { value: "a", weight: 1 },
      { value: "b", weight: 4 },
    ]);
  });

  it("picks entries proportionally to their weights", () => {
    const list = WeightedListUtils.build(
      WeightedListUtils.entries(["a", { value: "b", weight: 9 }]),
      "test",
    );
    const random = new Random(99);
    let heavy = 0;

    for (let index = 0; index < 10000; index++) {
      if (WeightedListUtils.pick(list, random) === "b") {
        heavy++;
      }
    }

    expect(heavy / 10000).toBeGreaterThan(0.87);
    expect(heavy / 10000).toBeLessThan(0.93);
  });

  it("rejects empty lists and bad weights", () => {
    expect(() => WeightedListUtils.build([], "x")).toThrow(/must not be empty/);
    expect(() => WeightedListUtils.build([{ value: 1, weight: -1 }], "x")).toThrow(/positive/);
  });
});
