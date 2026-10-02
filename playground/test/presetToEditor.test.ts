import type { FireInput } from "konfeti";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildInput } from "../src/buildOptions";
import { DEMO_SVG } from "../src/demoAssets";
import { MAX_BURSTS } from "../src/editor/burstState";
import { presetToEditor } from "../src/editor/presetToEditor";
import type { LoadIssue } from "../src/editor/presetToEditor";
import { createComparer, resolveBursts } from "./helpers/comparable";
import { createFakeAssets } from "./helpers/fakeAssets";

const assets = createFakeAssets();

/**
 * Load Fire Input and Return Its Issues.
 *
 * @param input - Fire Input (untrusted shapes are cast through unknown)
 * @returns Issues
 */
function issuesOf(input: unknown): readonly LoadIssue[] {
  return presetToEditor(input as FireInput, assets).issues;
}

/**
 * Load One Burst and Return Its State.
 *
 * @param input - Fire Options
 * @returns Burst State
 */
function burstOf(input: unknown): Readonly<Record<string, unknown>> {
  const [burst] = presetToEditor(input as FireInput, assets).bursts;

  if (burst === undefined) {
    throw new Error("no burst");
  }

  return burst;
}

beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("presetToEditor reports what it cannot represent", () => {
  it.each([
    ["a hook", { onStart: () => undefined }, { path: "onStart", reason: "hook" }],
    ["an unknown key", { colours: ["#fff"] }, { path: "colours", reason: "unknown" }],
    [
      "a client point origin",
      { origin: { clientX: 1, clientY: 2 } },
      { path: "origin", reason: "form" },
    ],
    ["an empty shape list", { shapes: [] }, { path: "shapes", reason: "value" }],
    ["a custom shape", { shapes: [{ type: "blob" }] }, { path: "shapes[0].type", reason: "form" }],
    [
      "a second entry of a type",
      { shapes: [{ type: "star" }, { type: "star" }] },
      { path: "shapes[1]", reason: "form" },
    ],
    ["a negative delay", { delay: -1 }, { path: "delay", reason: "value" }],
    [
      "a formation streamed",
      { formation: { text: "HI" }, emission: { mode: "stream", duration: 500 } },
      { path: "emission", reason: "value" },
    ],
    [
      "a formation with text and image",
      { formation: { text: "HI", image: "/logo.png" } },
      { path: "formation", reason: "value" },
    ],
    [
      "an unsupported blend mode",
      { paper: { blendMode: "copy" } },
      { path: "paper.blendMode", reason: "value" },
    ],
    [
      "a stroke without color",
      { paper: { stroke: { width: 2 } } },
      { path: "paper.stroke", reason: "value" },
    ],
    [
      "a custom physics module",
      { physics: { magnet: 1 } },
      { path: "physics.magnet", reason: "form" },
    ],
  ])("%s", (_label, input, expected) => {
    expect(issuesOf(input)).toContainEqual(expected);
  });

  it("still loads entries out of card order, and a fly-in in appear mode", () => {
    expect(issuesOf({ shapes: [{ type: "heart" }, { type: "star" }] })).toEqual([
      { path: "shapes[1]", reason: "order" },
    ]);
    expect(burstOf({ shapes: [{ type: "heart" }, { type: "star" }] })["star.enabled"]).toBe(true);

    const appear = { formation: { text: "HI", mode: "appear", assemble: 500 } };
    expect(issuesOf(appear)).toEqual([{ path: "formation.assemble", reason: "ignored" }]);
    expect(burstOf(appear)["formationAssemble"]).toBe(500);
  });

  it("keeps at most the bursts the editor holds, and turns an empty list into one burst", () => {
    const many = Array.from({ length: MAX_BURSTS + 2 }, () => ({}));

    expect(presetToEditor(many, assets).bursts).toHaveLength(MAX_BURSTS);
    expect(issuesOf(many)).toEqual([{ path: `[${String(MAX_BURSTS)}]`, reason: "form" }]);
    expect(presetToEditor([], assets).bursts).toHaveLength(1);
    expect(issuesOf([])).toEqual([{ path: "", reason: "value" }]);
  });
});

describe("presetToEditor maps image sources to their own options", () => {
  it.each([
    ["the demo canvas", assets.coinCanvas, "demo canvas"],
    ["the demo url", assets.coinUrl, "demo url"],
    ["the inline svg", DEMO_SVG, "inline svg"],
    ["any other address", "data:image/png;base64,AAAA", "url"],
  ])("image card: %s", (_label, src, option) => {
    expect(burstOf({ shapes: [{ type: "image", src }] })["image.src"]).toBe(option);
  });

  it("reports a source the card cannot show", () => {
    expect(issuesOf({ shapes: [{ type: "image", src: assets.sheetCanvas }] })).toEqual([
      { path: "shapes[0].src", reason: "form" },
    ]);
  });

  it("maps sprite sheets and formation images", () => {
    const sheet = { type: "spritesheet", frames: { cols: 4, rows: 2 } };

    expect(burstOf({ shapes: [{ ...sheet, src: assets.sheetUrl }] })["sprite.src"]).toBe(
      "demo url",
    );
    expect(burstOf({ shapes: [{ ...sheet, src: "/sheet.png" }] })).toEqual(
      expect.objectContaining({
        "sprite.src": "url",
        "sprite.url": "/sheet.png",
        "sprite.cols": 4,
      }),
    );
    expect(burstOf({ formation: { image: assets.logoCanvas } })["formationImage"]).toBe(
      "demo logo",
    );
    expect(burstOf({ formation: { image: "/logo.png" } })["formationImageUrl"]).toBe("/logo.png");
  });
});

describe("presetToEditor round trips", () => {
  it.each([
    ["a formation with a capped particle count", { particleCount: 60, formation: { text: "HI" } }],
    [
      "an appear formation with an easing",
      { formation: { text: "HI", mode: "appear", easing: "linear" } },
    ],
    ["a per-corner radius", { paper: { cornerRadius: { tl: 6, br: [2, 4] } } }],
    ["a text weight keyword", { shapes: [{ type: "text", text: ["A", "B"], fontWeight: "bold" }] }],
    [
      "a ribbon under a paper flip at its default axis",
      {
        paper: { flip: { axis: "x", frequency: [0.8, 1.6] } },
        shapes: [{ type: "paper" }, { type: "ribbon" }],
      },
    ],
  ])("%s", (_label, input) => {
    const compare = createComparer();
    const { bursts, issues } = presetToEditor(input as FireInput, assets);

    expect(issues).toEqual([]);
    expect(resolveBursts(buildInput(bursts, assets), compare)).toEqual(
      resolveBursts(input as FireInput, compare),
    );
    expect(resolveBursts(buildInput(bursts, assets, { mode: "explicit" }), compare)).toEqual(
      resolveBursts(input as FireInput, compare),
    );
  });
});
