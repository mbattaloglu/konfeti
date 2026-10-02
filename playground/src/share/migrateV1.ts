import type { NumberPair } from "../controlTypes";
import { applyBurstDiff, applyGlobalDiff } from "../editor/burstState";
import type { BurstState, GlobalState } from "../editor/burstState";
import { VECTOR_DEFAULTS } from "../editor/libraryDefaults";
import { asList, isFiniteNumber } from "../editor/optionValues";
import { V1_INITIALS } from "./v1Initials";

/**
 * A v1 Share Link Moved into the Editor State.
 */
export type MigratedLink = {
  /**
   * Canonical Burst State.
   */
  readonly burst: BurstState;
  /**
   * Global (Hooks) State.
   */
  readonly globals: GlobalState;
};

/**
 * Frozen v1 Initial Table.
 */
type V1Table = typeof V1_INITIALS;

/**
 * Key of the Frozen v1 Initial Table.
 */
type V1Key = keyof V1Table;

/**
 * v1 Keys with a Number Initial.
 */
type NumberKey = { [K in V1Key]: V1Table[K] extends number ? K : never }[V1Key];

/**
 * v1 Keys with a Text Initial.
 */
type StringKey = { [K in V1Key]: V1Table[K] extends string ? K : never }[V1Key];

/**
 * v1 Keys with a Color List Initial.
 */
type ListKey = { [K in V1Key]: V1Table[K] extends readonly string[] ? K : never }[V1Key];

/**
 * Normalized Attractor Point (v1 offered named points besides the pointer).
 */
type AttractPoint = {
  /**
   * Horizontal Position, 0–1.
   */
  readonly x: number;
  /**
   * Vertical Position, 0–1.
   */
  readonly y: number;
};

/**
 * Prefixes of the v1 Shape Cards (each card has `<prefix>.enabled` and `<prefix>.weight`).
 */
const V1_CARDS = [
  "paper",
  "star",
  "triangle",
  "polygon",
  "heart",
  "ribbon",
  "path",
  "emoji",
  "text",
  "image",
  "sprite",
] as const;

/**
 * v1 Keys Whose Value Moves into the Burst Unchanged (same key, same kind, same initial in v2).
 */
const COPIED_KEYS: readonly string[] = [
  "particleCount",
  "spread",
  "useSeed",
  "seed",
  "streamDuration",
  "intervalEvery",
  "intervalTimes",
  "delay",
  "emissionMode",
  "formation",
  "formationSource",
  "formationText",
  "formationImage",
  "formationImageColors",
  "formationMode",
  "formationAssemble",
  "formationEasing",
  "formationHold",
  "formationSpacing",
  "formationFit",
  "form",
  "useAspect",
  "colors",
  "colorMode",
  "backColor",
  "backShade",
  "gradient",
  "colorOverLife",
  "colorOverLifeTo",
  "colorOverLifeEasing",
  "stroke",
  "strokeColor",
  "blendMode",
  "flip",
  "flipAxis",
  "wobble",
  "fadeIn",
  "fadeOut",
  "fadeStart",
  "fadeEasing",
  "scaleOverLife",
  "scaleTo",
  "shadow",
  "shadowX",
  "shine",
  "trail",
  "trailLength",
  "trailOpacity",
  "trailCustomColor",
  "trailColor",
  "useTerminal",
  "terminalVelocity",
  "swirl",
  "floor",
  "floorY",
  "floorBounce",
  "floorFriction",
  "attract",
  "attractRadius",
  "attractFalloff",
  "star.innerRatio",
  "ribbon.thickness",
  "path.d",
  "emoji.list",
  "text.list",
  "text.fontWeight",
  "image.src",
  "sprite.src",
  "sprite.loop",
  "sprite.randomStart",
  ...V1_CARDS.flatMap((card) => [`${card}.enabled`, `${card}.weight`]),
];

/**
 * v1 Hook Keys, Copied into the Global Values (hooks are shared by every burst in v2).
 */
const GLOBAL_KEYS: readonly string[] = [
  "hookStart",
  "hookSpawn",
  "hookUpdate",
  "rainbow",
  "hookDeath",
  "hookComplete",
  "logEvents",
];

/**
 * v1 Single Values That Became Spans: `v` → `[v, v]`.
 * An absent key takes its v1 initial. For most keys that equals the v2 initial; for the flip, wobble, swirl,
 * ribbon length and size keys, whose v2 initials changed, it brings back what the sender saw.
 */
const PAIRED_KEYS = [
  "angle",
  "originY",
  "aspectRatio",
  "cornerRadius",
  "strokeWidth",
  "opacity",
  "scale",
  "trailWidth",
  "gravity",
  "drag",
  "wind",
  "attractStrength",
  "star.points",
  "polygon.sides",
  "sprite.fps",
  "flipFrequency",
  "wobbleAmplitude",
  "wobbleFrequency",
  "swirlStrength",
  "swirlFrequency",
  "ribbon.length",
  "star.size",
  "triangle.size",
  "polygon.size",
  "heart.size",
  "path.size",
  "emoji.size",
  "text.size",
  "image.size",
  "sprite.size",
] as const satisfies readonly NumberKey[];

/**
 * v1 Numbers Copied as They Are; an Absent One Takes Its v1 Initial (the v2 initial changed).
 */
const MATERIALIZED_NUMBERS = [
  "gradientAngle",
  "shadowBlur",
  "shadowY",
] as const satisfies readonly NumberKey[];

/**
 * v1 Texts Copied as They Are; an Absent One Takes Its v1 Initial (the v2 initial changed).
 */
const MATERIALIZED_STRINGS = [
  "formationFont",
  "scaleEasing",
  "text.fontFamily",
] as const satisfies readonly StringKey[];

/**
 * v1 Shape Color Overrides: a non-empty list is kept, an empty one inherits the paper colors.
 */
const COLOR_OVERRIDES = ["star.colors", "heart.colors"] as const satisfies readonly ListKey[];

/**
 * Lowest Ribbon Wave Count.
 * Mirrors the library's literal lower clamp of `waves` (`shapes/handlers/ribbonShape.ts`), which has no config entry.
 */
const RIBBON_MIN_WAVES = 1;

/**
 * Start of the v1 Rotation Range: v1 sent `rotation: [0, rotationMax]`.
 */
const V1_ROTATION_START = 0;

/**
 * Shadow Opacity of Every v1 Shadow: v1 sent the shadow color as an opaque hex color.
 */
const V1_SHADOW_ALPHA = 1;

/**
 * Attract Target Value for the Pointer.
 */
const POINTER_TARGET = "pointer";

/**
 * Attract Target Value for a Fixed Point.
 */
const POINT_TARGET = "point";

/**
 * Named v1 Attractor Points, as the v1 builder sent them.
 */
const V1_ATTRACT_POINTS: Readonly<Record<string, AttractPoint>> = {
  center: { x: 0.5, y: 0.5 },
  "top center": { x: 0.5, y: 0.15 },
};

/**
 * Check Whether a Payload Value Has a Kind a v1 Control Could Hold.
 * A finite number, a string, a boolean or a list of strings, as v1 `isSameKind` required; the v2 checks
 * (acceptValue) decide the rest.
 *
 * @param value - Untrusted Value
 * @returns v1 Kind Flag
 */
function hasV1Kind(value: unknown): boolean {
  if (typeof value === "string" || typeof value === "boolean") {
    return true;
  }

  const items = asList(value);

  return isFiniteNumber(value) || (items?.every((item) => typeof item === "string") ?? false);
}

/**
 * Read a v1 Number the Way the v1 Editor Restored It.
 *
 * @param values - v1 Payload
 * @param key - v1 Key with a Number Initial
 * @returns The Payload's Finite Number, Else the v1 Initial
 */
function numberOf(values: Readonly<Record<string, unknown>>, key: NumberKey): number {
  const value = values[key];

  return isFiniteNumber(value) ? value : V1_INITIALS[key];
}

/**
 * Read a v1 Text the Way the v1 Editor Restored It.
 *
 * @param values - v1 Payload
 * @param key - v1 Key with a Text Initial
 * @returns The Payload's String, Else the v1 Initial
 */
function stringOf(values: Readonly<Record<string, unknown>>, key: StringKey): string {
  const value = values[key];

  return typeof value === "string" ? value : V1_INITIALS[key];
}

/**
 * Read a v1 Color List the Way the v1 Editor Restored It.
 *
 * @param values - v1 Payload
 * @param key - v1 Key with a List Initial
 * @returns The Payload's List of Strings, Else the v1 Initial
 */
function listOf(values: Readonly<Record<string, unknown>>, key: ListKey): readonly string[] {
  const items = asList(values[key]);

  if (!items?.every((item): item is string => typeof item === "string")) {
    return V1_INITIALS[key];
  }

  return items;
}

/**
 * Sort Two Numbers into a Pair.
 *
 * @param a - First Number
 * @param b - Second Number
 * @returns Sorted Pair
 */
function sorted(a: number, b: number): NumberPair {
  return a <= b ? [a, b] : [b, a];
}

/**
 * Mirror a v1 Magnitude into a Symmetric Span (`v` → `[-v, v]`).
 *
 * @param value - v1 Magnitude
 * @returns Symmetric Pair (`[0, 0]` for 0, never `-0`)
 */
function symmetric(value: number): NumberPair {
  return value === 0 ? [0, 0] : [-value, value];
}

/**
 * Turn the v1 Attract Target into the v2 Target Keys.
 *
 * @param target - v1 Target Name
 * @returns `attractTarget`, plus `attractX` / `attractY` for a named point
 */
function attractTargetOf(target: string): Readonly<Record<string, string | NumberPair>> {
  const point = Object.hasOwn(V1_ATTRACT_POINTS, target) ? V1_ATTRACT_POINTS[target] : undefined;

  if (point === undefined) {
    return { attractTarget: POINTER_TARGET };
  }

  return {
    attractTarget: POINT_TARGET,
    attractX: [point.x, point.x],
    attractY: [point.y, point.y],
  };
}

/**
 * Move a v1 Share Link (a flat diff against the v1 initials) into the Editor State.
 * Keys the v2 controls reshaped are rebuilt from their v1 parts; keys whose v1 initial differs from the v2 one
 * are filled in from the frozen v1 initials, so the editor shows what the sender saw. Every value then passes the
 * v2 checks, and unknown keys are dropped.
 *
 * @param values - v1 Payload (untrusted)
 * @returns Burst and Global State
 */
export function migrateV1(values: Readonly<Record<string, unknown>>): MigratedLink {
  const burst: Record<string, unknown> = {};
  const globals: Record<string, unknown> = {};

  for (const key of COPIED_KEYS) {
    const value = values[key];

    if (hasV1Kind(value)) {
      burst[key] = value;
    }
  }

  for (const key of GLOBAL_KEYS) {
    const value = values[key];

    if (hasV1Kind(value)) {
      globals[key] = value;
    }
  }

  for (const key of PAIRED_KEYS) {
    const value = numberOf(values, key);
    burst[key] = [value, value];
  }

  for (const key of MATERIALIZED_NUMBERS) {
    burst[key] = numberOf(values, key);
  }

  for (const key of MATERIALIZED_STRINGS) {
    burst[key] = stringOf(values, key);
  }

  const lifetime = numberOf(values, "lifetime");
  const jitter = numberOf(values, "lifetimeJitter");
  const originX = numberOf(values, "originX");
  const originSpread = numberOf(values, "originSpreadX");
  const tilt = numberOf(values, "tilt");
  const viewBox = numberOf(values, "path.viewBox");
  // the v1 builder's formulas, so the spans hold exactly what v1 sent
  burst["velocity"] = sorted(numberOf(values, "velocityMin"), numberOf(values, "velocityMax"));
  burst["lifetime"] = [Math.round(lifetime * (1 - jitter)), Math.round(lifetime * (1 + jitter))];
  burst["originX"] =
    originSpread > 0 ? [originX - originSpread, originX + originSpread] : [originX, originX];
  burst["formationVelocity"] = sorted(
    numberOf(values, "formationVelocityMin"),
    numberOf(values, "formationVelocityMax"),
  );
  burst["width"] = sorted(numberOf(values, "widthMin"), numberOf(values, "widthMax"));
  burst["height"] = sorted(numberOf(values, "heightMin"), numberOf(values, "heightMax"));
  burst["gradientColors"] = [stringOf(values, "gradientA"), stringOf(values, "gradientB")];
  burst["formationWidth"] = numberOf(values, "formationWidth");
  // v1 always sent the image formation's width
  burst["useFormationWidth"] = true;
  burst["shadowColor"] = stringOf(values, "shadowColor");
  burst["shadowAlpha"] = V1_SHADOW_ALPHA;
  burst["skew"] = symmetric(numberOf(values, "skew"));
  burst["rotationSpeed"] = symmetric(numberOf(values, "rotationSpeed"));
  // v1 sent [-tilt, tilt], which the library read as [tilt, tilt]
  burst["tilt"] = [tilt, tilt];
  burst["rotation"] = [V1_ROTATION_START, numberOf(values, "rotationMax")];
  // what the library made of the v1 slider's half and zero waves
  burst["ribbon.waves"] = Math.round(
    Math.min(
      Math.max(numberOf(values, "ribbon.waves"), RIBBON_MIN_WAVES),
      VECTOR_DEFAULTS.maxRibbonWaves,
    ),
  );
  burst["path.viewBox"] = viewBox;
  burst["path.viewBoxHeight"] = viewBox;
  Object.assign(burst, attractTargetOf(stringOf(values, "attractTarget")));

  for (const key of COLOR_OVERRIDES) {
    const colors = listOf(values, key);

    if (colors.length > 0) {
      burst[key] = colors;
    }
  }

  return { burst: applyBurstDiff(burst), globals: applyGlobalDiff(globals) };
}
