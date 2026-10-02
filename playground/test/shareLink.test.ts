import { KonfetiPalettes } from "konfeti";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildInput } from "../src/buildOptions";
import {
  applyBurstDiff,
  applyGlobalDiff,
  CONTROL_INDEX,
  initialBurst,
  initialGlobals,
  MAX_BURSTS,
  normalizeBurst,
  sameBurst,
} from "../src/editor/burstState";
import { asList } from "../src/editor/optionValues";
import { parseJson } from "../src/jsonIO";
import { migrateV1 } from "../src/share/migrateV1";
import type { MigratedLink } from "../src/share/migrateV1";
import {
  createShareLink,
  isShareable,
  MAX_SHARE_URL_LENGTH,
  readShareLink,
  restoreShared,
  toShareSettings,
} from "../src/share/shareLink";
import { V1_INITIALS } from "../src/share/v1Initials";
import V1_CONTROLS from "./fixtures/v1Controls.json";
import V1_LINKS from "./fixtures/v1Links.json";
import { createComparer, resolveBursts } from "./helpers/comparable";
import { createFakeAssets } from "./helpers/fakeAssets";

// fixtures/v1Links.json: five v1 link payloads with what the v1 builder made of them (`proto/freeze.mjs`, run
// read-only against `304f6b1`). fixtures/v1Controls.json: kind and initial of every v1 control at `304f6b1`.
// Both are frozen: the v1 controls and builder no longer exist.

/**
 * Demo Asset Stand-Ins Shared by Every Case.
 */
const assets = createFakeAssets();

/**
 * Page the Share Links Are Made On (other parameters and the hash must be handled as on the real site).
 */
const PAGE_URL = "http://localhost:3000/tools/konfeti/?lang=tr&x=1#controls";

/**
 * The Pink v1 Heart Colors.
 */
const V1_HEART_COLORS = ["#ff3d7f", "#ff8fb1", "#e0115f"];

/**
 * v1 Keys the Migration Drops by Design (the derived theme; upload URLs never travelled in v1 links).
 */
const DROPPED_V1_KEYS = ["colorTheme", "image.upload", "formationUpload"];

/**
 * Encode Any Value the Way a Share Link Carries It.
 *
 * @param value - JSON Value
 * @returns Base64url Text
 */
function encode(value: unknown): string {
  const binary = Array.from(new TextEncoder().encode(JSON.stringify(value)), (byte) =>
    String.fromCharCode(byte),
  ).join("");

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Open the Page with Some `s` Parameter Text and Read It Back.
 *
 * @param encoded - Raw `s` Parameter Text
 * @returns What readShareLink Returns
 */
function readWith(encoded: string): ReturnType<typeof readShareLink> {
  history.replaceState(null, "", `/tools/konfeti/?s=${encoded}`);

  return readShareLink();
}

/**
 * Migrate a v1 Payload and Return One Burst Value.
 *
 * @param payload - v1 Payload
 * @param key - v2 Burst Key
 * @returns Migrated Value
 */
function migrated(payload: Readonly<Record<string, unknown>>, key: string): unknown {
  return migrateV1(payload).burst[key];
}

/**
 * Return the Options the v2 Control of a Key Accepts.
 *
 * @param key - Control Key
 * @returns Accepted Options (empty for an unknown key)
 */
function optionsOf(key: string): readonly string[] {
  return CONTROL_INDEX.entries.get(key)?.options ?? [];
}

/**
 * Pick a Value Different from a v1 Initial, of the Same Kind.
 *
 * @param key - v1 Key
 * @param kind - v1 Control Kind
 * @param initial - v1 Initial Value
 * @returns Changed Value a v1 Link Could Carry
 * @throws Error for a control kind v1 did not have
 */
function changedValue(key: string, kind: string, initial: unknown): unknown {
  switch (kind) {
    case "toggle":
      return initial !== true;
    case "range":
      return Number(initial) + 1;
    case "color":
      return "#123456";
    case "palette":
      return ["#123456"];
    case "text":
      return `${String(initial)}x`;
    case "file":
      return "blob:changed";
    case "select":
      // "point" was never a v1 attract target; a v1 link names the point
      return key === "attractTarget"
        ? "center"
        : optionsOf(key).find((option) => option !== initial);
    case "chips":
      return [optionsOf(key).find((option) => !(asList(initial)?.includes(option) ?? false))];
    default:
      throw new Error(`v1 had no "${kind}" control (${key})`);
  }
}

describe("share link v2", () => {
  beforeEach(() => {
    history.replaceState(null, "", PAGE_URL);
  });

  it("round-trips one burst with its global diff", () => {
    const burst = applyBurstDiff({
      particleCount: 123,
      gravity: [-1, 5],
      colors: KonfetiPalettes.GOLD,
    });
    const globals = applyGlobalDiff({ hookUpdate: true });
    const settings = toShareSettings([burst], globals);

    expect(settings).toEqual({
      v: 2,
      b: [{ particleCount: 123, gravity: [-1, 5], colors: [...KonfetiPalettes.GOLD] }],
      g: { hookUpdate: true },
    });

    const link = new URL(createShareLink(settings));

    // the receiver's own language, no hash, other parameters kept
    expect(link.searchParams.has("lang")).toBe(false);
    expect(link.hash).toBe("");
    expect(link.searchParams.get("x")).toBe("1");

    history.replaceState(null, "", link.href);
    const shared = readShareLink();

    expect(shared).toEqual({ version: 2, settings });

    const restored = restoreShared(shared!);

    expect(restored.bursts).toHaveLength(1);
    expect(sameBurst(restored.bursts[0]!, burst)).toBe(true);
    expect(restored.bursts[0]!["colorTheme"]).toBe("gold");
    expect(restored.globals).toEqual(globals);
  });

  it("leaves the global diff out when no hook changed", () => {
    expect(toShareSettings([applyBurstDiff({ spread: 90 })], initialGlobals())).toEqual({
      v: 2,
      b: [{ spread: 90 }],
    });
    expect(toShareSettings([initialBurst()], applyGlobalDiff({ logEvents: true }))).toEqual({
      v: 2,
      b: [{}],
      g: { logEvents: true },
    });
  });

  it("is null when nothing differs, and upload URLs never enter it", () => {
    const uploaded = normalizeBurst({ "image.upload": "blob:x", formationUpload: "blob:y" });

    expect(toShareSettings([initialBurst()], initialGlobals())).toBeNull();
    expect(toShareSettings([uploaded], initialGlobals())).toBeNull();
    expect(toShareSettings([applyBurstDiff({ "image.enabled": true })], initialGlobals())).toEqual({
      v: 2,
      b: [{ "image.enabled": true }],
    });
  });

  it("removes the s parameter for no settings", () => {
    history.replaceState(null, "", "/tools/konfeti/?s=abc&lang=en&x=1#share");
    const link = new URL(createShareLink(null));

    expect(link.searchParams.has("s")).toBe(false);
    expect(link.searchParams.has("lang")).toBe(false);
    expect(link.searchParams.get("x")).toBe("1");
    expect(link.hash).toBe("");
  });

  it("is null for broken or foreign values", () => {
    const tooMany = Array.from({ length: MAX_BURSTS + 1 }, () => ({}));

    expect(readWith("%%%")).toBeNull();
    expect(readWith("")).toBeNull();
    expect(readWith(btoa("{"))).toBeNull();
    expect(readWith(encode("text"))).toBeNull();
    expect(readWith(encode([1, 2]))).toBeNull();
    expect(readWith(encode(null))).toBeNull();
    expect(readWith(encode({ v: 2, b: {} }))).toBeNull();
    expect(readWith(encode({ v: 2 }))).toBeNull();
    expect(readWith(encode({ v: 2, b: [] }))).toBeNull();
    expect(readWith(encode({ v: 2, b: tooMany }))).toBeNull();
    expect(readWith(encode({ v: 2, b: [{}, 1] }))).toBeNull();
    expect(readWith(encode({ v: 2, b: [[]] }))).toBeNull();
    expect(readWith(encode({ v: 3, b: [{}] }))).toBeNull();
    expect(readWith(encode({ v: "2", b: [{}] }))).toBeNull();

    history.replaceState(null, "", "/tools/konfeti/?x=1");
    expect(readShareLink()).toBeNull();
  });

  it("reads MAX_BURSTS bursts, ignores a malformed g or p and keeps a preset name", () => {
    const most = Array.from({ length: MAX_BURSTS }, () => ({}));

    expect(readWith(encode({ v: 2, b: most }))).toEqual({
      version: 2,
      settings: { v: 2, b: most },
    });
    expect(readWith(encode({ v: 2, b: [{ spread: 90 }], g: [true], p: 5 }))).toEqual({
      version: 2,
      settings: { v: 2, b: [{ spread: 90 }] },
    });
    expect(readWith(encode({ v: 2, b: [{}], g: { hookUpdate: true }, p: "SNOW" }))).toEqual({
      version: 2,
      settings: { v: 2, b: [{}], g: { hookUpdate: true }, p: "SNOW" },
    });
  });

  it("reads a link without v as a v1 flat diff", () => {
    expect(readWith(encode({ particleCount: 123, lifetime: 5000 }))).toEqual({
      version: 1,
      values: { particleCount: 123, lifetime: 5000 },
    });
  });

  it("checks every restored value against its control", () => {
    const restored = restoreShared({
      version: 2,
      settings: {
        v: 2,
        b: [
          {
            "image.upload": "blob:x",
            angle: [350, 10],
            delay: -1,
            blendMode: "copy",
            colorTheme: "custom",
            spread: "wide",
            nope: 1,
            hookUpdate: true,
          },
          { particleCount: 7 },
        ],
        g: { hookStart: false, particleCount: 5, rainbow: "yes" },
      },
    });
    const [first, second] = restored.bursts;

    expect(first).toEqual({ ...initialBurst(), angle: [10, 350] });
    expect(second).toEqual({ ...initialBurst(), particleCount: 7 });
    expect(restored.globals).toEqual({ ...initialGlobals(), hookStart: false });
  });

  it("keeps the initials of values that would freeze the page or break the gradient", () => {
    const switches = {
      "sprite.enabled": true,
      "path.enabled": true,
      emissionMode: "interval",
      gradient: true,
      useAspect: true,
    };
    const restored = restoreShared({
      version: 2,
      settings: {
        v: 2,
        b: [
          {
            ...switches,
            "sprite.fps": [1e18, 1e18],
            intervalEvery: 1e-9,
            intervalTimes: 1e12,
            scale: [1e308, 1e308],
            aspectRatio: [1e308, 1e308],
            "star.size": [-1e308, 1e308],
            "path.viewBox": 1e-300,
          },
        ],
      },
    });

    expect(restored.bursts[0]).toEqual({ ...initialBurst(), ...switches });
  });

  it("migrates a v1 link when it restores one", () => {
    const restored = restoreShared({
      version: 1,
      values: { particleCount: 123, hookUpdate: true },
    });

    expect(restored.bursts).toHaveLength(1);
    expect(restored.bursts[0]!["particleCount"]).toBe(123);
    expect(restored.bursts[0]!["lifetime"]).toEqual([2720, 3680]);
    expect(restored.globals["hookUpdate"]).toBe(true);
  });
});

describe("migrateV1", () => {
  it("keeps the frozen v1 initials equal to the v1 control table", () => {
    const table: Readonly<Record<string, { readonly initial: unknown }>> = V1_CONTROLS;

    expect(Object.keys(table)).toHaveLength(163);

    for (const [key, initial] of Object.entries(V1_INITIALS)) {
      expect(table[key]?.initial, key).toEqual(initial);
    }
  });

  it("returns normalized state", () => {
    const { burst, globals } = migrateV1({ particleCount: 123 });

    expect(normalizeBurst(burst)).toEqual(burst);
    // v1's pink heart palette (its initial) comes back as the heart card's colors override
    expect(burst["heart.styles"]).toEqual(["colors"]);
    expect(Object.keys(burst)).toEqual([...CONTROL_INDEX.burstKeys, "heart.colors"]);
    expect(Object.keys(globals)).toEqual(CONTROL_INDEX.globalKeys);
  });

  it("brings a changed value of every v1 control into the v2 state", () => {
    const base = migrateV1({});
    const missed: string[] = [];

    for (const [key, { kind, initial }] of Object.entries(V1_CONTROLS)) {
      const result: MigratedLink = migrateV1({ [key]: changedValue(key, kind, initial) });
      const reached = JSON.stringify(result) !== JSON.stringify(base);

      if (reached === DROPPED_V1_KEYS.includes(key)) {
        missed.push(key);
      }
    }

    expect(missed).toEqual([]);
  });

  it("copies values and fills in the v1 initials that changed", () => {
    const { burst } = migrateV1({ particleCount: 123 });

    expect(burst["particleCount"]).toBe(123);
    expect(burst["lifetime"]).toEqual([2720, 3680]);
    expect(burst["formationFont"]).toBe("900 110px sans-serif");
    expect(burst["gradientAngle"]).toBe(45);
    expect(burst["scaleEasing"]).toBe("easeInQuad");
    expect(burst["shadowBlur"]).toBe(6);
    expect(burst["shadowY"]).toBe(3);
    expect(burst["text.fontFamily"]).toBe("Inter, system-ui, sans-serif");
    expect(burst["flipFrequency"]).toEqual([1.2, 1.2]);
    expect(burst["wobbleAmplitude"]).toEqual([8, 8]);
    expect(burst["wobbleFrequency"]).toEqual([0.8, 0.8]);
    expect(burst["swirlStrength"]).toEqual([200, 200]);
    expect(burst["swirlFrequency"]).toEqual([0.6, 0.6]);
    expect(burst["ribbon.length"]).toEqual([30, 30]);
    expect(burst["star.size"]).toEqual([16, 16]);
    expect(burst["sprite.size"]).toEqual([26, 26]);
    expect(burst["heart.colors"]).toEqual(V1_HEART_COLORS);
    expect(burst["useFormationWidth"]).toBe(true);
    // v1 initial = v2 initial: nothing changes
    expect(burst["angle"]).toEqual([90, 90]);
    expect(burst["velocity"]).toEqual([1000, 1800]);
    expect(burst["gradientColors"]).toEqual(["#ff5e7e", "#26ccff"]);
  });

  it.each([
    ["lifetime", { lifetime: 5000 }, "lifetime", [4250, 5750]],
    ["lifetime with jitter", { lifetime: 5000, lifetimeJitter: 0.2 }, "lifetime", [4000, 6000]],
    [
      "origin spread",
      { originX: 0.5, originSpreadX: 0.35 },
      "originX",
      [0.15000000000000002, 0.85],
    ],
    ["origin without spread", { originX: 0.3 }, "originX", [0.3, 0.3]],
    ["reversed velocity", { velocityMin: 2000, velocityMax: 500 }, "velocity", [500, 2000]],
    ["formation velocity", { formationVelocityMin: 900 }, "formationVelocity", [700, 900]],
    ["width", { widthMin: 12, widthMax: 4 }, "width", [4, 12]],
    ["height", { heightMin: 3 }, "height", [3, 16]],
    ["angle", { angle: 75 }, "angle", [75, 75]],
    ["size", { "polygon.size": 30 }, "polygon.size", [30, 30]],
    ["skew", { skew: 20 }, "skew", [-20, 20]],
    ["rotation speed", { rotationSpeed: 100 }, "rotationSpeed", [-100, 100]],
    ["tilt", { tilt: 30 }, "tilt", [30, 30]],
    ["rotation", { rotationMax: 90 }, "rotation", [0, 90]],
    ["half ribbon waves", { "ribbon.waves": 0.5 }, "ribbon.waves", 1],
    ["fractional ribbon waves", { "ribbon.waves": 2.5 }, "ribbon.waves", 3],
    ["too many ribbon waves", { "ribbon.waves": 20 }, "ribbon.waves", 8],
    ["view box width", { "path.viewBox": 32 }, "path.viewBox", 32],
    ["view box height", { "path.viewBox": 32 }, "path.viewBoxHeight", 32],
    ["gradient", { gradientA: "#000000" }, "gradientColors", ["#000000", "#26ccff"]],
    ["formation width", { formationWidth: 300 }, "formationWidth", 300],
    ["star colors", { "star.colors": ["#ff0000"] }, "star.colors", ["#ff0000"]],
    ["star colors as an override", { "star.colors": ["#ff0000"] }, "star.styles", ["colors"]],
    ["no star colors", {}, "star.styles", []],
    ["empty heart colors", { "heart.colors": [] }, "heart.styles", []],
    ["wrong kind", { particleCount: "x" }, "particleCount", 60],
    ["wrong kind of a reshaped key", { lifetime: "x" }, "lifetime", [2720, 3680]],
    ["value outside the domain", { delay: -1 }, "delay", 0],
    ["a frame rate that would freeze the page", { "sprite.fps": 1e18 }, "sprite.fps", [12, 12]],
    ["an interval period that would stall a frame", { intervalEvery: 1e-9 }, "intervalEvery", 400],
    ["an interval count that would stall a frame", { intervalTimes: 1e12 }, "intervalTimes", 5],
    ["a scale that would overflow a gradient", { scale: 1e308 }, "scale", [1, 1]],
    ["a view box that would overflow a gradient", { "path.viewBox": 1e-300 }, "path.viewBox", 24],
  ] as const)("maps %s", (_label, payload, key, expected) => {
    expect(migrated(payload, key)).toEqual(expected);
  });

  it("never writes -0 for a zero rotation speed or skew", () => {
    const { burst } = migrateV1({ rotationSpeed: 0 });
    const speed = burst["rotationSpeed"];

    expect(speed).toEqual([0, 0]);
    expect(Array.isArray(speed) && speed.some((value) => Object.is(value, -0))).toBe(false);
    expect(burst["skew"]).toEqual([0, 0]);
  });

  it("turns the named attract points into a point target", () => {
    expect(migrateV1({ attractTarget: "top center" }).burst).toMatchObject({
      attractTarget: "point",
      attractX: [0.5, 0.5],
      attractY: [0.15, 0.15],
    });
    expect(migrateV1({ attractTarget: "center" }).burst).toMatchObject({
      attractTarget: "point",
      attractX: [0.5, 0.5],
      attractY: [0.5, 0.5],
    });
    expect(migrated({ attractTarget: "toString" }, "attractTarget")).toBe("pointer");
    expect(migrated({}, "attractTarget")).toBe("pointer");
  });

  it("makes every v1 shadow opaque", () => {
    expect(migrateV1({ shadowColor: "#FF0000" }).burst).toMatchObject({
      shadowColor: "#ff0000",
      shadowAlpha: 1,
    });
    expect(migrateV1({ shadow: true }).burst).toMatchObject({
      shadow: true,
      shadowColor: "#000000",
      shadowAlpha: 1,
    });
  });

  it("drops unknown keys, the theme and upload URLs, and moves hooks into the globals", () => {
    const base = migrateV1({});
    const { burst, globals } = migrateV1({
      nope: 1,
      v2Only: true,
      velocity: [1, 2],
      colorTheme: "gold",
      "image.upload": "blob:x",
      formationUpload: "blob:y",
      hookUpdate: true,
    });

    expect(burst).toEqual(base.burst);
    expect(burst["colorTheme"]).toBe("classic");
    expect(burst).not.toHaveProperty("hookUpdate");
    expect(globals).toEqual({ ...initialGlobals(), hookUpdate: true });
  });

  it("builds a hook-only link with the values its sender saw", () => {
    expect(buildInput([migrateV1({ hookUpdate: true }).burst], assets)).toEqual({
      lifetime: [2720, 3680],
      paper: { flip: { frequency: 1.2 }, wobble: { amplitude: 8, frequency: 0.8 } },
    });
  });
});

describe("migrated v1 links fire like v1 did", () => {
  beforeEach(() => {
    // the seed of a burst without one comes from Math.random
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(Object.entries(V1_LINKS))("%s", (_name, { payload, v1Options }) => {
    const compare = createComparer();
    const fired = buildInput([migrateV1(payload).burst], assets);

    expect(resolveBursts(fired, compare)).toEqual(
      resolveBursts(parseJson(JSON.stringify(v1Options), assets), compare),
    );
  });
});

describe("own style groups in links", () => {
  it("restore a star palette from a link made before the overrides as a colors override", () => {
    const restored = restoreShared({
      version: 2,
      settings: { v: 2, b: [{ "star.enabled": true, "star.colors": ["#ff0000"] }] },
    });

    expect(restored.bursts[0]?.["star.styles"]).toEqual(["colors"]);
    expect(restored.bursts[0]?.["star.colors"]).toEqual(["#ff0000"]);
  });

  it("carry a listed group through a link", () => {
    const burst = normalizeBurst({
      "star.enabled": true,
      "star.styles": ["shine"],
      "star.shine": 0.8,
    });
    const settings = toShareSettings([burst], initialGlobals());

    expect(settings).not.toBeNull();
    expect(restoreShared({ version: 2, settings: settings! }).bursts).toEqual([burst]);
  });
});

describe("link length", () => {
  it("hands out links up to the limit the host opens", () => {
    expect(isShareable("x".repeat(MAX_SHARE_URL_LENGTH))).toBe(true);
    expect(isShareable("x".repeat(MAX_SHARE_URL_LENGTH + 1))).toBe(false);
  });
});

describe("several bursts in a link", () => {
  it("carry every burst and restore them in order", () => {
    const bursts = [
      normalizeBurst({ particleCount: 10 }),
      normalizeBurst({ particleCount: 20, delay: 300 }),
      normalizeBurst({ "star.enabled": true }),
    ];
    const settings = toShareSettings(bursts, initialGlobals());

    expect(settings?.b).toHaveLength(3);
    expect(restoreShared({ version: 2, settings: settings! }).bursts).toEqual(bursts);
  });
});
