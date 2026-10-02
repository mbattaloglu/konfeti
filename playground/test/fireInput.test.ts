import { afterEach, describe, expect, it, vi } from "vitest";

import { seedList, withClickOrigin } from "../src/editor/fireInput";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fire input helpers", () => {
  it("seed every list entry that has no seed, and leave a single burst alone", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    expect(seedList([{ particleCount: 1 }, { seed: 7 }])).toEqual([
      { particleCount: 1, seed: 2 ** 31 },
      { seed: 7 },
    ]);
    expect(seedList({ particleCount: 1 })).toEqual({ particleCount: 1 });
  });

  it("place every entry without an origin at the click point", () => {
    const point = { clientX: 10, clientY: 20 };

    expect(withClickOrigin({ spread: 30 }, point)).toEqual({ spread: 30, origin: point });
    expect(withClickOrigin([{}, { origin: { x: 0.2 } }], point)).toEqual([
      { origin: point },
      { origin: { x: 0.2 } },
    ]);
  });
});
