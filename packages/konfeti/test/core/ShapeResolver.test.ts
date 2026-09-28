import { describe, expect, it } from "vitest";

import { OptionResolver } from "../../src/core/resolve/OptionResolver";
import { shapeAt } from "../helpers/resolveHelpers";

describe("shape mix", () => {
  it("builds a weighted shape list", () => {
    const resolved = OptionResolver.resolveFire([
      { shapes: [{ type: "paper", weight: 3 }, { type: "star" }, { type: "heart", weight: 2 }] },
    ]);

    expect(resolved.shapes.items.map((shape) => shape.kind)).toEqual(["paper", "vector", "vector"]);
    expect(resolved.shapes.cumulativeWeights).toEqual([3, 4, 6]);
  });

  it("inherits the paper base style and lets the entry override it", () => {
    const resolved = OptionResolver.resolveFire([
      {
        paper: { colors: "red", opacity: 0.5 },
        shapes: [{ type: "star" }, { type: "triangle", colors: "blue" }],
      },
    ]);

    expect(shapeAt(resolved, 0).style.palette.colors).toEqual(["rgb(255,0,0)"]);
    expect(shapeAt(resolved, 0).style.opacity).toEqual([0.5, 0.5]);
    expect(shapeAt(resolved, 1).style.palette.colors).toEqual(["rgb(0,0,255)"]);
  });

  it("applies per-type style defaults below user settings", () => {
    const emoji = OptionResolver.resolveFire([{ shapes: [{ type: "emoji", emoji: "🎉" }] }]);
    const forced = OptionResolver.resolveFire([
      { paper: { flip: true }, shapes: [{ type: "emoji", emoji: "🎉" }] },
    ]);

    expect(shapeAt(emoji).style.flip).toBeNull();
    expect(shapeAt(forced).style.flip).not.toBeNull();
  });

  it("creates one star variant per point count", () => {
    const shape = shapeAt(
      OptionResolver.resolveFire([{ shapes: [{ type: "star", points: [4, 6] }] }]),
    );

    expect(shape.kind === "vector" && shape.variants.items).toHaveLength(3);
  });

  it("clamps polygon sides", () => {
    const shape = shapeAt(
      OptionResolver.resolveFire([{ shapes: [{ type: "polygon", sides: [1, 40] }] }]),
    );

    expect(shape.kind === "vector" && shape.variants.items).toHaveLength(10);
  });

  it("maps custom paths into the unit box", () => {
    const shape = shapeAt(
      OptionResolver.resolveFire([
        { shapes: [{ type: "path", path: "M0 0L10 20", viewBox: [10, 20] }] },
      ]),
    );

    if (shape.kind !== "vector") {
      throw new Error("expected vector");
    }

    expect(shape.variants.items[0]).toMatchObject({
      scale: 1 / 20,
      offsetX: -5,
      offsetY: -10,
      aspect: 2,
    });
  });

  it("rasterizes text once per text and palette color", () => {
    const shape = shapeAt(
      OptionResolver.resolveFire([
        { shapes: [{ type: "text", text: ["A", "B"], colors: ["red", "blue", "lime"] }] },
      ]),
    );

    if (shape.kind !== "bitmap") {
      throw new Error("expected bitmap");
    }

    expect(shape.perColor).toBe(true);
    expect(shape.sources.items).toHaveLength(2);
    expect(shape.sources.items[0]).toHaveLength(3);
  });

  it("wraps emoji and image sources", () => {
    const canvas = document.createElement("canvas");
    const emoji = shapeAt(
      OptionResolver.resolveFire([{ shapes: [{ type: "emoji", emoji: ["🎉", "✨"] }] }]),
    );
    const image = shapeAt(
      OptionResolver.resolveFire([{ shapes: [{ type: "image", src: canvas }] }]),
    );

    expect(emoji.kind === "bitmap" && emoji.sources.items).toHaveLength(2);
    expect(image.kind === "bitmap" && image.sources.items[0]?.[0]?.getImage()).toBe(canvas);
  });

  it("resolves spritesheet frame layouts", () => {
    const canvas = document.createElement("canvas");
    const grid = shapeAt(
      OptionResolver.resolveFire([
        { shapes: [{ type: "spritesheet", src: canvas, frames: { cols: 4, rows: 2, count: 99 } }] },
      ]),
    );

    expect(grid.kind === "sprite" && grid.frames).toEqual({
      kind: "grid",
      cols: 4,
      rows: 2,
      count: 8,
    });
    expect(() =>
      OptionResolver.resolveFire([{ shapes: [{ type: "spritesheet", src: canvas, frames: [] }] }]),
    ).toThrow(/frames/);
    expect(() =>
      OptionResolver.resolveFire([
        { shapes: [{ type: "spritesheet", src: canvas, frames: { cols: 0, rows: 1 } }] },
      ]),
    ).toThrow(/cols/);
  });
});
