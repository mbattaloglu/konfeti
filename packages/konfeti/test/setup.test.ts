import { describe, expect, it } from "vitest";

describe("test environment", () => {
  it("provides a mocked 2d canvas context", () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    expect(ctx).not.toBeNull();
  });
});
