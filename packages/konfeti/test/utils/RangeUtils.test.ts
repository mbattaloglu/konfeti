import { describe, expect, it } from "vitest";

import { Random } from "../../src/utils/Random";
import { RangeUtils } from "../../src/utils/RangeUtils";

describe("RangeUtils.toTuple", () => {
  it("accepts numbers, tuples and objects", () => {
    expect(RangeUtils.toTuple(5, "x")).toEqual([5, 5]);
    expect(RangeUtils.toTuple([1, 3], "x")).toEqual([1, 3]);
    expect(RangeUtils.toTuple({ min: 2, max: 4 }, "x")).toEqual([2, 4]);
  });

  it("swaps reversed bounds", () => {
    expect(RangeUtils.toTuple([9, 3], "x")).toEqual([3, 9]);
  });

  it("rejects non-finite values with the option name", () => {
    expect(() => RangeUtils.toTuple(Number.NaN, "paper.width")).toThrow(/paper\.width/);
    expect(() => RangeUtils.toTuple([0, Infinity], "angle")).toThrow(TypeError);
  });
});

describe("RangeUtils.sample", () => {
  it("returns the fixed value for collapsed ranges", () => {
    expect(RangeUtils.sample([4, 4], new Random(1))).toBe(4);
  });

  it("samples inside the range", () => {
    const random = new Random(3);

    for (let index = 0; index < 200; index++) {
      const value = RangeUtils.sample([-5, 5], random);
      expect(value).toBeGreaterThanOrEqual(-5);
      expect(value).toBeLessThanOrEqual(5);
    }
  });
});
