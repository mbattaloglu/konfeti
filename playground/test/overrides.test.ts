import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildBurst } from "../src/buildOptions";
import { CONTROL_SECTIONS } from "../src/controls";
import type { ControlState, ControlValue } from "../src/controlTypes";
import {
  applyBurstDiff,
  CONTROL_INDEX,
  diffBurst,
  initialBurst,
  normalizeBurst,
} from "../src/editor/burstState";
import { countHiddenAdvanced } from "../src/editor/editorMode";
import { DEFAULT_PALETTE } from "../src/editor/libraryDefaults";
import {
  canonicalStyles,
  cloneForOverride,
  overrideGroupsFor,
  stylesKey,
} from "../src/editor/overrideGroups";
import { overrideStartValues } from "../src/editor/overrides";
import { createComparer, resolveBursts } from "./helpers/comparable";
import { createFakeAssets } from "./helpers/fakeAssets";

const assets = createFakeAssets();

/**
 * Prefixes of Every Card.
 */
const PREFIXES = CONTROL_INDEX.cards.map((card) => card.prefix);

/**
 * Find a Base Control of the Control Table.
 *
 * @param key - Control Key
 * @returns Control
 */
function baseControl(key: string): (typeof CONTROL_SECTIONS)[number]["controls"][number] {
  const control = CONTROL_SECTIONS.flatMap((section) => section.controls).find(
    (item) => item.key === key,
  );

  if (control === undefined) {
    throw new Error(`no control ${key}`);
  }

  return control;
}

/**
 * Build a Burst from Changes on Top of the Initial State.
 *
 * @param changes - Changed Values
 * @returns Burst State
 */
function burstWith(changes: Readonly<Record<string, ControlValue>>): ControlState {
  return { ...initialBurst(), ...changes };
}

/**
 * Add an Own Style Group to a Card the Way the Editor Does (start values, then the list entry).
 *
 * @param state - Burst State
 * @param prefix - Card Prefix
 * @param groupKey - Group Key
 * @returns New Burst State
 */
function withGroup(state: ControlState, prefix: string, groupKey: string): ControlState {
  const listed = canonicalStyles(prefix, [...(state[stylesKey(prefix)] as string[]), groupKey]);

  return {
    ...state,
    ...overrideStartValues(prefix, groupKey, state),
    [stylesKey(prefix)]: listed,
  };
}

beforeEach(() => {
  // the seed of a burst without one comes from Math.random
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("override groups", () => {
  it("offer geometry only on the paper card", () => {
    expect(overrideGroupsFor("paper").map((group) => group.key)).toEqual(
      expect.arrayContaining(["form", "width", "height", "aspectRatio", "cornerRadius", "skew"]),
    );
    expect(overrideGroupsFor("star").some((group) => group.kind === "geometry")).toBe(false);
    expect(overrideGroupsFor("star")).toHaveLength(21);
  });

  it("clean a list: known groups only, each once, in canonical order", () => {
    expect(canonicalStyles("star", ["trail", "bogus", "scale", "trail", "width"])).toEqual([
      "scale",
      "trail",
    ]);
    expect(canonicalStyles("paper", ["trail", "width"])).toEqual(["width", "trail"]);
    expect(canonicalStyles("star", "trail")).toEqual([]);
  });

  it("copy a control for a card: prefixed key and condition, shape option path", () => {
    expect(cloneForOverride(baseControl("trailLength"), "star", ["trail", "trailLength"])).toEqual(
      expect.objectContaining({
        key: "star.trailLength",
        param: "shapes[].trail.length",
        when: ["star.trail", true],
      }),
    );
    // the aspect ratio's switch stays outside its group, so the copy has no condition
    expect(
      cloneForOverride(baseControl("aspectRatio"), "paper", ["aspectRatio"]).when,
    ).toBeUndefined();
    expect(cloneForOverride(baseControl("colors"), "star", ["colors"])).toEqual(
      expect.objectContaining({ key: "star.colors", minItems: 1 }),
    );
  });
});

describe("adding an own style group", () => {
  it.each(PREFIXES)("never changes what the %s card fires", (prefix) => {
    const compare = createComparer();
    const base = burstWith({ [`${prefix}.enabled`]: true, trail: true, opacity: [0.5, 0.9] });
    const before = resolveBursts(buildBurst(base, assets), compare);

    for (const group of overrideGroupsFor(prefix)) {
      // an entry cannot unset an inherited aspect ratio, so this group always sends its value
      if (group.key === "aspectRatio") {
        continue;
      }

      const state = withGroup(base, prefix, group.key);

      expect(buildBurst(state, assets).shapes, group.key).toEqual(buildBurst(base, assets).shapes);
      expect(resolveBursts(buildBurst(state, assets), compare), group.key).toEqual(before);
    }
  });

  it("starts from what the shape inherits, its own defaults included", () => {
    const state = burstWith({ "emoji.enabled": true });

    expect(overrideStartValues("emoji", "flip", state)).toEqual(
      expect.objectContaining({ "emoji.flip": false }),
    );
    expect(overrideStartValues("emoji", "rotation", state)).toEqual({
      "emoji.rotation": [-20, 20],
    });
    expect(overrideStartValues("star", "colors", state)).toEqual({
      "star.colors": DEFAULT_PALETTE,
    });
  });

  it("then sends only what differs from the inherited value", () => {
    const emoji = withGroup(burstWith({ "emoji.enabled": true }), "emoji", "flip");
    const flipped = { ...emoji, "emoji.flip": true };

    expect(buildBurst(flipped, assets).shapes).toStrictEqual([
      { type: "emoji", emoji: ["🎉", "✨", "🥳", "🎊"], flip: true },
    ]);

    const trail = withGroup(burstWith({ "star.enabled": true }), "star", "trail");
    expect(buildBurst({ ...trail, "star.trail": true }, assets).shapes).toStrictEqual([
      { type: "star", trail: true },
    ]);
  });

  it("resolves the same in minimal and explicit mode", () => {
    const compare = createComparer();
    let state = burstWith({
      "paper.enabled": true,
      "emoji.enabled": true,
      "ribbon.enabled": true,
      flip: true,
      flipFrequency: [0.8, 1.6],
    });
    state = withGroup(state, "paper", "width");
    state = withGroup(state, "emoji", "flip");
    state = withGroup(state, "ribbon", "trail");
    state = { ...state, "paper.width": [20, 30], "emoji.flip": true, "ribbon.trail": true };

    expect(resolveBursts(buildBurst(state, assets, { mode: "explicit" }), compare)).toEqual(
      resolveBursts(buildBurst(state, assets), compare),
    );
  });

  it("sends the paper card's geometry only when it differs, its aspect ratio always", () => {
    const paper = burstWith({ "paper.enabled": true });

    expect(buildBurst(withGroup(paper, "paper", "width"), assets).shapes).toStrictEqual([
      { type: "paper" },
    ]);
    expect(
      buildBurst({ ...withGroup(paper, "paper", "width"), "paper.width": [20, 30] }, assets).shapes,
    ).toStrictEqual([{ type: "paper", width: [20, 30] }]);
    expect(
      buildBurst(
        { ...withGroup(paper, "paper", "aspectRatio"), "paper.aspectRatio": [2, 2] },
        assets,
      ).shapes,
    ).toStrictEqual([{ type: "paper", aspectRatio: 2 }]);
  });
});

describe("image addresses", () => {
  it("send a typed address exactly, and drop the entry while it is blank", () => {
    const url = " data:image/png;base64,AAAA ";

    expect(
      buildBurst(burstWith({ "image.enabled": true, "image.src": "url", "image.url": url }), assets)
        .shapes,
    ).toStrictEqual([{ type: "image", src: url }]);
    expect(
      buildBurst(
        burstWith({ "image.enabled": true, "image.src": "url", "image.url": "  " }),
        assets,
      ).shapes,
    ).toBeUndefined();
  });

  it("describe a sprite sheet by its grid, with a frame count only when set", () => {
    const sheet = { "sprite.enabled": true, "sprite.src": "url", "sprite.url": "/sheet.png" };

    expect(
      buildBurst(burstWith({ ...sheet, "sprite.cols": 4, "sprite.rows": 2 }), assets).shapes,
    ).toStrictEqual([{ type: "spritesheet", src: "/sheet.png", frames: { cols: 4, rows: 2 } }]);
    expect(
      buildBurst(burstWith({ ...sheet, "sprite.count": 5 }), assets).shapes?.[0],
    ).toStrictEqual(expect.objectContaining({ frames: { cols: 8, rows: 1, count: 5 } }));
  });

  it("use a typed formation image, or the demo logo while it is blank", () => {
    const image = {
      formation: true,
      formationSource: "image",
      formationImage: "url",
    };

    expect(
      buildBurst(burstWith({ ...image, formationImageUrl: "/logo.png" }), assets).formation,
    ).toStrictEqual({ image: "/logo.png" });
    expect(
      buildBurst(burstWith({ ...image, formationImageUrl: "" }), assets).formation,
    ).toStrictEqual({ image: assets.logoCanvas });
  });
});

describe("own style groups in the burst state", () => {
  it("hold every key of a listed group and none of an unlisted one", () => {
    const burst = normalizeBurst({
      "star.styles": ["trail"],
      "star.trail": true,
      "star.shine": 0.5,
    });

    expect(burst["star.trail"]).toBe(true);
    // missing keys of the group come from the base control's initial
    expect(burst["star.trailLength"]).toBe(initialBurst()["trailLength"]);
    expect(burst).not.toHaveProperty("star.shine");
  });

  it("travel whole in a diff and come back the same", () => {
    const burst = normalizeBurst({
      "star.enabled": true,
      "star.styles": ["trail"],
      "star.trail": true,
    });
    const diff = diffBurst(burst);

    expect(diff["star.styles"]).toEqual(["trail"]);
    expect(diff).toHaveProperty("star.trailLength");
    expect(applyBurstDiff(diff)).toEqual(burst);
  });

  it("are checked when restored from a link", () => {
    const burst = applyBurstDiff({
      "star.styles": ["scale", "bogus", "colors"],
      "star.scale": [2, 1],
      "star.colors": [],
      "heart.trailLength": 5,
    });

    expect(burst["star.styles"]).toEqual(["scale", "colors"]);
    // pairs are sorted; an empty colors override falls back to the base palette
    expect(burst["star.scale"]).toEqual([1, 2]);
    expect(burst["star.colors"]).toEqual(DEFAULT_PALETTE);
    expect(burst).not.toHaveProperty("heart.trailLength");
  });

  it("turn a star or heart palette from an older link into a colors override", () => {
    const burst = applyBurstDiff({ "star.colors": ["#ff0000"], "heart.colors": [] });

    expect(burst["star.styles"]).toEqual(["colors"]);
    expect(burst["star.colors"]).toEqual(["#ff0000"]);
    expect(burst["heart.styles"]).toEqual([]);
  });

  it("count in the Advanced badge per group, on switched-on cards only", () => {
    const listed = { "star.styles": ["scale", "trail"], "heart.styles": ["shine"] };

    expect(countHiddenAdvanced([normalizeBurst(listed)], {}, CONTROL_INDEX)).toBe(0);
    expect(
      countHiddenAdvanced([normalizeBurst({ ...listed, "star.enabled": true })], {}, CONTROL_INDEX),
    ).toBe(2);
  });
});
