import type { FireInput } from "konfeti";

import { EASING_FUNCTIONS } from "../../../packages/konfeti/src/config/EasingFunctions";
import { OptionResolver } from "../../../packages/konfeti/src/core/resolve/OptionResolver";
import type { ResolvedFireOptions } from "../../../packages/konfeti/src/types/resolved/ResolvedFireOptions";
import { DEFAULT_ORIGIN } from "../../src/editor/libraryDefaults";
import { asList, isRecord, pairOf } from "../../src/editor/optionValues";
import { isBurstList } from "../../src/jsonIO";
import { RecordingPath2D } from "./RecordingPath2D";

/**
 * Converts Resolved Values into a Plain, Comparable Form.
 * One converter shares its identity tokens across everything it converts: create one per test and pass both
 * sides of a comparison through it.
 */
export type Comparer = (value: unknown) => unknown;

/**
 * Easing Name by Easing Function (named easings are shared function references).
 */
const EASING_NAMES: ReadonlyMap<unknown, string> = new Map(
  Object.entries(EASING_FUNCTIONS).map(([name, easing]) => [easing, `easing:${name}`]),
);

/**
 * Create a Comparable-Form Converter.
 * Numbers lose their sign of zero, named easings become their names, recorded paths their path data, URL images
 * their URL; other functions, paths, elements and bitmaps become identity tokens (never `isEqualNode`, which
 * calls any two same-size canvases equal). Class instances keep their class name; `spawn` closures, rebuilt on
 * every resolve, are skipped.
 *
 * @returns Converter
 */
export function createComparer(): Comparer {
  const ids = new Map<object, string>();

  const idOf = (kind: string, value: object): string => {
    const known = ids.get(value);

    if (known !== undefined) {
      return known;
    }

    const id = `${kind}#${String(ids.size + 1)}`;
    ids.set(value, id);

    return id;
  };

  const walk = (value: unknown): unknown => {
    if (typeof value === "number") {
      return Object.is(value, -0) ? 0 : value;
    }

    if (typeof value === "function") {
      return EASING_NAMES.get(value) ?? idOf("function", value);
    }

    if (typeof value !== "object" || value === null) {
      return value;
    }

    if (value instanceof RecordingPath2D && value.source !== null) {
      return `Path2D(${value.source})`;
    }

    if (value instanceof Path2D) {
      // cached builder paths (stars, polygons, ribbons …): equal parameters share one instance and other
      // parameters build another, so identity is what separates them (a constant would hide innerRatio, points,
      // sides or ribbon changes)
      return idOf("Path2D", value);
    }

    if (value instanceof HTMLImageElement) {
      // URL images are cached per URL
      return `img(${value.src})`;
    }

    if (value instanceof Element || value instanceof ImageBitmap) {
      return idOf(value.constructor.name, value);
    }

    if (value instanceof Float32Array) {
      return Array.from(value, walk);
    }

    const items = asList(value);

    if (items !== null) {
      return items.map(walk);
    }

    const fields = Object.fromEntries(
      Object.entries(value)
        .filter(([key, field]) => !(key === "spawn" && typeof field === "function"))
        .map(([key, field]) => [key, walk(field)]),
    );
    const prototype: unknown = Object.getPrototypeOf(value);

    return prototype === Object.prototype || prototype === null
      ? fields
      : { __class: value.constructor.name, ...fields };
  };

  return walk;
}

/**
 * Give a Point Attract Target Both Axes, the Way the Burst Resolves It When It Starts.
 * The resolver passes the target through raw; an omitted axis falls back to the default origin later.
 *
 * @param resolved - Resolved Burst
 * @returns Resolved Burst with a Two-Axis Point Target
 */
function withTargetAxes(resolved: ResolvedFireOptions): ResolvedFireOptions {
  const attract = resolved.physics.attract;
  const target: unknown = attract?.target;

  if (attract === null || !isRecord(target) || Object.getPrototypeOf(target) !== Object.prototype) {
    return resolved;
  }

  const x = pairOf(target["x"] ?? DEFAULT_ORIGIN.x);
  const y = pairOf(target["y"] ?? DEFAULT_ORIGIN.y);

  // an unreadable axis is compared as given
  if (x === null || y === null) {
    return resolved;
  }

  return {
    ...resolved,
    physics: { ...resolved.physics, attract: { ...attract, target: { x, y } } },
  };
}

/**
 * Resolve Every Burst of a Fire Input into Comparable Form.
 * Mirrors the engine's `[defaults, burst]` layers with an instance without defaults; lists resolve entry by entry.
 *
 * @param input - Fire Input
 * @param compare - Shared Converter
 * @returns Comparable Resolved Bursts
 */
export function resolveBursts(input: FireInput, compare: Comparer): unknown[] {
  return (isBurstList(input) ? input : [input]).map((burst) =>
    compare(withTargetAxes(OptionResolver.resolveFire([{}, burst]))),
  );
}
