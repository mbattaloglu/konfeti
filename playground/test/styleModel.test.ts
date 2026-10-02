import { describe, expect, it } from "vitest";

import { DEFAULT_STYLE } from "../src/editor/libraryDefaults";
import {
  diffStyle,
  effectiveStyle,
  explicitStyle,
  GEOMETRY_GROUPS,
  handlerStyleKeys,
  inheritedStyle,
  libraryStyle,
  STYLE_KEYS,
} from "../src/editor/styleModel";

describe("style groups", () => {
  it("cover every ShapeStyle key in DEFAULT_STYLE order", () => {
    expect(STYLE_KEYS).toEqual(Object.keys(DEFAULT_STYLE));
  });

  it("hold the library defaults in full form", () => {
    expect(libraryStyle("flip")).toEqual({ frequency: [0.6, 1.8], axis: "x" });
    expect(libraryStyle("shadow")).toBe(false);
    expect(libraryStyle("tilt")).toEqual([0, 0]);
    expect(libraryStyle("backColor")).toBe("auto");
  });
});

describe("effectiveStyle", () => {
  it("merges toggle layers like the resolver", () => {
    // an object after `false` merges over the defaults and turns the effect back on
    expect(effectiveStyle("flip", [true, false, { axis: "y" }])).toEqual({
      frequency: [0.6, 1.8],
      axis: "y",
    });
    // `true` keeps what is already merged
    expect(effectiveStyle("flip", [true, { axis: "y" }, true])).toEqual({
      frequency: [0.6, 1.8],
      axis: "y",
    });
    expect(effectiveStyle("trail", [false, true])).toEqual({
      length: 10,
      width: [3, 3],
      opacity: 0.5,
      color: "particle",
    });
  });

  it("takes the highest layer of plain and whole keys", () => {
    expect(effectiveStyle("rotation", [[0, 360], [-20, 20], undefined])).toEqual([-20, 20]);
    expect(effectiveStyle("stroke", [false, { color: "#F00" }])).toEqual({
      color: "#ff0000",
      width: [1, 1],
    });
  });

  it("refuses option forms the editor cannot show", () => {
    expect(effectiveStyle("stroke", [true])).toBeNull();
    expect(effectiveStyle("colors", [["red"]])).toBeNull();
    expect(effectiveStyle("flip", [{ frequency: "fast" }])).toBeNull();
  });
});

describe("diffStyle and explicitStyle", () => {
  it("send a merge key as the differing sub-keys over what is inherited", () => {
    const inherited = { frequency: [0.6, 1.8], axis: "x" } as const;

    expect(diffStyle("flip", { frequency: [0.6, 1.8], axis: "y" }, inherited)).toEqual({
      axis: "y",
    });
    expect(diffStyle("flip", inherited, inherited)).toBeUndefined();
    expect(diffStyle("flip", false, inherited)).toBe(false);
    expect(diffStyle("flip", inherited, false)).toBe(true);
    // the shadow option type has no `true`
    expect(
      diffStyle("shadow", { color: "rgba(0,0,0,0.25)", blur: 4, offsetX: 0, offsetY: 2 }, false),
    ).toEqual({});
  });

  it("write every sub-key in explicit form", () => {
    expect(explicitStyle({ color: "#ff0000", width: [1, 1] })).toEqual({
      color: "#ff0000",
      width: 1,
    });
    expect(explicitStyle(false)).toBe(false);
    expect(explicitStyle([2, 5])).toEqual([2, 5]);
  });
});

describe("handler style defaults", () => {
  it("list the keys each handler has its own default for", () => {
    expect(handlerStyleKeys("spritesheet")).toEqual([
      "rotation",
      "rotationSpeed",
      "flip",
      "wobble",
    ]);
    expect(handlerStyleKeys("emoji")).toEqual(["rotation", "rotationSpeed", "flip"]);
    expect(handlerStyleKeys("ribbon")).toEqual(["flip"]);
    expect(handlerStyleKeys("star")).toEqual([]);
  });

  it("sit between the library defaults and the base paper", () => {
    expect(inheritedStyle("rotation", "emoji", {})).toEqual([-20, 20]);
    expect(inheritedStyle("rotation", "emoji", { rotation: [0, 90] })).toEqual([0, 90]);
    expect(inheritedStyle("flip", "ribbon", {})).toEqual({ frequency: [0.6, 1.8], axis: "y" });
    expect(inheritedStyle("flip", "ribbon", { flip: { frequency: 2 } })).toEqual({
      frequency: [2, 2],
      axis: "y",
    });
  });
});

describe("geometry groups", () => {
  it("compare a single corner radius with four equal corners", () => {
    const corners = GEOMETRY_GROUPS.find((group) => group.key === "cornerRadius");
    const perCorner = { tl: [2, 2], tr: [2, 2], br: [2, 2], bl: [2, 2] } as const;

    expect(corners?.same([2, 2], perCorner)).toBe(true);
    expect(corners?.same([0, 0], { ...perCorner, tl: [0, 0] })).toBe(false);
  });
});
